import { Prisma } from '@prisma/client'
import { Elysia, t } from 'elysia'
import {
	ACTIVITY_TYPE,
	AppException,
	DOC_DETAIL,
	DOC_OPTIONS,
	HTTP_STATUS,
	NotFoundException,
	PERMISSION,
	PREFIX,
	PaginationReqDto,
	ROUTER,
	ResWrapper,
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
		async ({ query: { take, skip } }) => {
			const [docs, count] = await Promise.all([
				db.user.findMany({
					orderBy: { created: 'desc' },
					take,
					skip,
					select: {
						id: true,
						enabled: true,
						created: true,
						username: true,
						modified: true,
						mfaTelegramEnabled: true,
						mfaTotpEnabled: true,
						telegramUsername: true,
						protected: true,
						sessions: {
							take: 1,
							orderBy: { created: 'desc' },
							select: { created: true },
						},
						roleUsers: {
							select: { role: { select: { name: true, id: true } } },
						},
					},
				}),
				db.user.count(),
			])

			return castToRes({
				docs,
				count,
			})
		},
		{
			beforeHandle: permissionCheck(PERMISSION.USER_VIEW),
			query: PaginationReqDto,
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
				throw new AppException(
					'exception.item-exists',
					HTTP_STATUS.HTTP_409_CONFLICT,
					{
						args: { item: `Username ${username} ` },
					},
				)
			}

			if (id) {
				const existUser = await db.user.findUnique({
					where: { id },
					select: { protected: true },
				})
				if (!existUser) {
					throw new NotFoundException('exception.item-not-found', {
						args: { item: `User with id ${id}` },
					})
				}
				if (existUser.protected) {
					throw new AppException('exception.document-protected')
				}

				const data: Prisma.UserUpdateInput = {
					username,
					enabled,
					roleUsers: {
						deleteMany: { roleId: { notIn: roleIds } },
						connectOrCreate: roleIds.map(roleId => ({
							where: { roleId_userId: { roleId, userId: id } },
							create: {
								roleId,
								id: token12(PREFIX.ROLE_USER),
							},
						})),
					},
				}
				if (password) {
					const {
						passwordExpired,
						password: passwordHash,
						passwordCreated,
					} = await passwordService.createPassword(password)
					data.password = passwordHash
					data.passwordExpired = passwordExpired
					data.passwordCreated = passwordCreated
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
					throw new AppException('exception.validation-error')
				}
				await db.$transaction(async tx => {
					const newUser = await tx.user.create({
						data: {
							id: token12(PREFIX.USER),
							username,
							enabled,
							protected: false,
							...(await passwordService.createPassword(password)),
							roleUsers: {
								create: roleIds.map(id => ({
									roleId: id,
									id: token12(PREFIX.ROLE_USER),
								})),
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
			beforeHandle: permissionCheck(PERMISSION.USER_UPDATE),
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
