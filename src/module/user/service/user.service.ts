import { Prisma } from '@prisma/client'
import {
	ACTIVITY_TYPE,
	AppException,
	HTTP_STATUS,
	IPaginationReq,
	IReqMeta,
	NotFoundException,
	PREFIX,
	token12,
} from '../../../common'
import { db, userEmitter } from '../../../config'
import { activityService } from '../../activity/service'
import { IPaginateUserRes, IUserMeta, IUserUpsert } from '../type'
import { passwordService } from './auth-util.service'

export const userService = {
	async paginate({ take, skip }: IPaginationReq): Promise<IPaginateUserRes> {
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
					roleUsers: { select: { role: { select: { name: true, id: true } } } },
				},
			}),
			db.user.count(),
		])

		return {
			docs,
			count,
		}
	},

	async upsert(
		{ id, username, password, enabled, roleIds }: IUserUpsert,
		user: IUserMeta,
		meta: IReqMeta,
	): Promise<void> {
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
				const { passwordExpired, passwordHash, passwordCreated } =
					await passwordService.createPassword(password)
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
				activityService.create({
					user,
					meta,
					type: ACTIVITY_TYPE.UPDATE_USER,
				}),
			])
			userEmitter.emit('userUpdated', { id: user.id })
		} else {
			if (!password) {
				throw new AppException('exception.validation-error')
			}
			const { passwordHash, passwordExpired, passwordCreated } =
				await passwordService.createPassword(password)
			await db.$transaction([
				db.user.create({
					data: {
						id: token12(PREFIX.USER),
						username,
						enabled,
						protected: false,
						password: passwordHash,
						passwordExpired,
						passwordCreated,
						roleUsers: {
							create: roleIds.map(id => ({
								roleId: id,
								id: token12(PREFIX.ROLE_USER),
							})),
						},
					},
					select: { id: true },
				}),
				activityService.create({
					user,
					meta,
					type: ACTIVITY_TYPE.CREATE_USER,
				}),
			])
		}
	},
}
