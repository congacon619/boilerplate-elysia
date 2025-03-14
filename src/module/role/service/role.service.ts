import { Prisma } from '@prisma/client'
import {
	ACTIVITY_TYPE,
	AppException,
	HTTP_STATUS,
	NotFoundException,
	PREFIX,
	token12,
} from '../../../common'
import { IPaginationReq, IReqMeta } from '../../../common/type'
import { db } from '../../../config'
import { activityService } from '../../activity/service'
import { IUserMeta } from '../../user/type'
import { IPaginateRoleRes, IUpsertRole } from '../type'

export const roleService = {
	async paginate({ take, skip }: IPaginationReq): Promise<IPaginateRoleRes> {
		const [docs, count] = await Promise.all([
			db.role.findMany({
				take,
				skip,
			}),
			db.role.count(),
		])
		return { docs, count }
	},

	async del(ids: string[], user: IUserMeta, meta: IReqMeta): Promise<void> {
		const existUserRole = await db.roleUser.findFirst({
			where: { roleId: { in: ids } },
		})
		if (existUserRole) {
			throw new AppException('exception.permission-denied')
		}

		await db.$transaction([
			db.role.deleteMany({ where: { id: { in: ids } } }),
			activityService.create({
				type: ACTIVITY_TYPE.DEL_ROLE,
				meta,
				user,
			}),
		])
	},

	async upsert(
		input: IUpsertRole,
		user: IUserMeta,
		meta: IReqMeta,
	): Promise<void> {
		const { id, ...data } = input
		const where: Prisma.RoleWhereInput[] = [{ name: input.name }]
		if (id) {
			where.push({ id: { not: id } })
		}
		const exist = await db.role.findFirst({
			where: { AND: where },
			select: { id: true },
		})
		if (exist) {
			throw new AppException(
				'exception.item-exists',
				HTTP_STATUS.HTTP_409_CONFLICT,
				{
					args: { item: `Role name ${data.name} ` },
				},
			)
		}

		if (id) {
			const role = await db.role.findUnique({
				where: { id },
				select: { protected: true },
			})
			if (!role) {
				throw new NotFoundException('exception.item-not-found', {
					args: { item: `Role with id ${id}` },
				})
			}
			if (role.protected) {
				throw new AppException('exception.document-protected')
			}

			await db.$transaction([
				db.role.update({
					where: { id },
					data,
					select: { id: true },
				}),
				activityService.create({
					type: ACTIVITY_TYPE.UPDATE_ROLE,
					user,
					meta,
					reference: { id, ...data },
				}),
			])
		} else {
			await db.$transaction(async tx => {
				const newRole = await tx.role.create({
					data: {
						id: token12(PREFIX.ROLE),
						...data,
					},
					select: { id: true },
				})

				activityService.create(
					{
						type: ACTIVITY_TYPE.CREATE_ROLE,
						user,
						meta,
						reference: { id: newRole.id, ...data },
					},
					tx,
				)
			})
		}
	},
}
