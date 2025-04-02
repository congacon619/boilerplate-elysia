import { Prisma } from '@prisma/client'
import { Elysia, t } from 'elysia'
import {
	ACTIVITY_TYPE,
	CoreErr,
	DOC_DETAIL,
	DOC_OPTIONS,
	HTTP_STATUS,
	NotFoundErr,
	PREFIX,
	ROUTER,
	ResWrapper,
	SYS_USER_ID,
	authErrors,
	token12,
} from '../common'
import { castToRes, db, reqMeta, userEmitter } from '../config'
import {
	activityService,
	authCheck,
	passwordService,
	permissionCheck,
} from '../service'
import { PaginateUserResDto, UserUpsertDto } from './dto'

export const userController = new Elysia({
	name: 'UserController',
	detail: { tags: [DOC_OPTIONS.tags.user.name] },
	prefix: ROUTER.USER.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
	.get(
		'/',
		async () => {
			const users = await db.user.findMany({
				where: { id: { notIn: [SYS_USER_ID] } },
				select: {
					id: true,
					username: true,
					enabled: true,
					created: true,
					modified: true,
					mfaTelegramEnabled: true,
					telegramUsername: true,
					mfaTotpEnabled: true,
					roles: {
						select: { role: true },
					},
					sessions: {
						take: 1,
						orderBy: { created: 'desc' },
						select: { created: true },
					},
				},
			})
			return castToRes(
				users.map(({ roles, ...user }) => ({
					...user,
					roles: roles.map(r => r.role),
				})),
			)
		},
		{
			beforeHandle: permissionCheck('USER.VIEW'),
			detail: {
				...DOC_DETAIL.USER_PAGINATE,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(PaginateUserResDto),
				...authErrors,
			},
		},
	)
	.post(
		'/',
		async ({
			body: { username, id, enabled, roleIds, password },
			currentUser,
			clientIp,
			userAgent,
		}) => {
			const where: Prisma.UserWhereInput[] = [{ username }]
			if (id) {
				where.push({ id: { not: id } })
			}
			const exist = await db.user.findFirst({
				where: { AND: where },
				select: { id: true },
			})
			if (exist) {
				throw new CoreErr(
					'exception.item-exists',
					HTTP_STATUS.HTTP_409_CONFLICT,
					{ args: { item: `Username ${username} ` } },
				)
			}

			if (id) {
				const existUser = await db.user.findUnique({
					where: { id },
					select: { id: true },
				})
				if (!existUser) {
					throw new NotFoundErr('exception.item-not-found', {
						args: { item: `User with id ${id}` },
					})
				}

				const data: Prisma.UserUpdateInput = {
					username,
					enabled,
					roles: {
						deleteMany: {
							playerId: id,
							roleId: { notIn: roleIds },
						},
						createMany: {
							skipDuplicates: true,
							data: roleIds.map(roleId => ({ roleId, id: token12() })),
						},
					},
				}
				if (password) {
					const p = await passwordService.createPassword(password)
					data.password = p.password
					data.passwordExpired = p.passwordExpired
					data.passwordCreated = p.passwordCreated
					data.passwordAttempt = p.passwordAttempt
				}

				await db.$transaction([
					db.user.update({
						where: { id },
						data,
						select: { id: true },
					}),
					activityService.create(
						ACTIVITY_TYPE.UPDATE_USER,
						{ id, enabled, roleIds, username },
						{
							currentUser,
							clientIp,
							userAgent,
						},
					),
				])
				userEmitter.emit('userUpdated', { id })
			} else {
				if (!password) {
					throw new CoreErr('exception.validation-error')
				}
				await db.$transaction(async tx => {
					const newUser = await tx.user.create({
						data: {
							id: token12(PREFIX.USER),
							username,
							enabled,
							...(await passwordService.createPassword(password)),
							roles: {
								createMany: {
									data: roleIds.map(roleId => ({ roleId, id: token12() })),
								},
							},
						},
						select: { id: true },
					})
					activityService.create(
						ACTIVITY_TYPE.CREATE_USER,
						{ id: newUser.id, enabled, roleIds, username },
						{
							currentUser,
							clientIp,
							userAgent,
						},
						tx,
					)
				})
			}
			return castToRes(null)
		},
		{
			beforeHandle: permissionCheck('USER.UPDATE'),
			body: UserUpsertDto,
			detail: {
				...DOC_DETAIL.USER_UPSERT,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Null()),
				...authErrors,
			},
		},
	)
