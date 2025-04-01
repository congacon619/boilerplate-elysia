import { Prisma } from '@prisma/client'
import { Elysia, t } from 'elysia'
import {
	ACTIVITY_TYPE,
	AppException,
	DOC_DETAIL,
	DOC_OPTIONS,
	ErrorResDto,
	IdsDto,
	PREFIX,
	ROUTER,
	ResWrapper,
	authErrors,
	defaultRoles,
	token12,
} from '../common'
import { castToRes, db, reqMeta } from '../config'
import { activityService, authCheck, permissionCheck } from '../service'
import { PaginateRoleResDto, RolePaginationDto, UpsertRoleDto } from './dto'

export const roleController = new Elysia({
	name: 'RoleController',
	detail: { tags: [DOC_OPTIONS.tags.role.name] },
	prefix: ROUTER.ROLE.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
	.get(
		'/',
		async ({ query: { userId } }) => {
			const where: Prisma.RoleWhereInput = {
				id: { notIn: [defaultRoles.system.id] },
			}

			if (userId) {
				where.players = {
					some: { player: { id: userId } },
				}
			}

			const roles = await db.role.findMany({
				where: where,
				select: {
					id: true,
					title: true,
					description: true,
					permissions: { select: { permissionId: true } },
					players: { select: { playerId: true } },
				},
			})

			return castToRes(
				roles.map(role => ({
					id: role.id,
					title: role.title,
					description: role.description,
					permissionIds: role.permissions.map(p => p.permissionId),
					playerIds: role.players.map(p => p.playerId),
				})),
			)
		},
		{
			beforeHandle: permissionCheck('ROLE.VIEW'),
			query: RolePaginationDto,
			detail: {
				...DOC_DETAIL.ROLE_PAGINATE,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(PaginateRoleResDto),
				...authErrors,
			},
		},
	)
	.post(
		'/',
		async ({
			body: { id, title, enabled, description, playerIds, permissionIds },
			clientIp,
			currentUser,
			userAgent,
		}) => {
			if (id) {
				if (
					[defaultRoles.administrator.id, defaultRoles.system.id].includes(id)
				) {
					throw new AppException('exception.permission-denied')
				}

				await db.$transaction([
					db.role.update({
						where: { id },
						data: {
							description,
							title,
							enabled,
							permissions: {
								deleteMany: {
									roleId: id,
									permissionId: { notIn: permissionIds },
								},
								createMany: {
									skipDuplicates: true,
									data: permissionIds.map(permId => ({
										id: token12(),
										permissionId: permId,
									})),
								},
							},
							players: {
								deleteMany: {
									roleId: id,
									playerId: { notIn: playerIds },
								},
								createMany: {
									skipDuplicates: true,
									data: playerIds.map(playerId => ({
										id: token12(),
										playerId,
									})),
								},
							},
						},
						select: { id: true },
					}),
					activityService.create(
						ACTIVITY_TYPE.UPDATE_ROLE,
						{ id, description, title, permissionIds, playerIds },
						{ userAgent, clientIp, currentUser },
					),
				])
			} else {
				await db.$transaction(async tx => {
					const newRole = await tx.role.create({
						data: {
							id: token12(PREFIX.ROLE),
							description,
							title,
							enabled,
							permissions: {
								createMany: {
									data: permissionIds.map(permId => ({
										id: token12(),
										permissionId: permId,
									})),
								},
							},
							players: {
								createMany: {
									data: playerIds.map(playerId => ({
										id: token12(),
										playerId,
									})),
								},
							},
						},
						select: { id: true },
					})

					await activityService.create(
						ACTIVITY_TYPE.CREATE_ROLE,
						{ id: newRole.id, description, title, permissionIds, playerIds },
						{ userAgent, clientIp, currentUser },
						tx,
					)
				})
			}
			return castToRes(null)
		},
		{
			body: UpsertRoleDto,
			beforeHandle: permissionCheck('ROLE.UPDATE'),
			detail: {
				...DOC_DETAIL.ROLE_UPSERT,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Null()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.ROLE.DEL,
		async ({ body: { ids }, currentUser, userAgent, clientIp }) => {
			const existUserRole = await db.rolePlayer.findFirst({
				where: { roleId: { in: ids } },
			})
			if (existUserRole) {
				throw new AppException('exception.permission-denied')
			}

			await db.$transaction([
				db.role.deleteMany({
					where: {
						id: { in: ids, notIn: Object.values(defaultRoles).map(x => x.id) },
					},
				}),
				activityService.create(
					ACTIVITY_TYPE.DEL_ROLE,
					{ roleIds: ids },
					{ currentUser, userAgent, clientIp },
				),
			])
			return castToRes(null)
		},
		{
			body: IdsDto,
			beforeHandle: permissionCheck('ROLE.DELETE'),
			detail: {
				...DOC_DETAIL.ROLE_DEL,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Null()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
