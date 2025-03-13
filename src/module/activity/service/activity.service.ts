import { Prisma, PrismaClient } from '@prisma/client'
import { ACTIVITY_TYPE, PERMISSION, PREFIX, token12 } from '../../../common'
import { IReqMeta } from '../../../common/type'
import { db } from '../../../config'
import { IUserMeta } from '../../user/type'
import { IActivityPaginate, IActivityPagingRes } from '../type'

export const activityService = {
	create(
		{
			type,
			meta,
			user,
			reference,
		}: {
			type: ACTIVITY_TYPE
			meta?: IReqMeta
			user: { id: string; sessionId?: string }
			reference?: object
		},
		tx?: Omit<
			PrismaClient,
			| '$on'
			| '$transaction'
			| '$connect'
			| '$disconnect'
			| '$use'
			| '$extends'
			| 'onModuleInit'
		>,
	): Prisma.PrismaPromise<{
		id: string
	}> {
		return (tx || db).activity.create({
			data: {
				id: token12(PREFIX.ACTIVITY),
				type,
				ip: meta?.ip,
				device: meta?.ua?.ua,
				sessionId: user.sessionId,
				createdById: user.id,
				reference,
			},
			select: { id: true },
		})
	},

	async paginate(
		{
			cursor,
			take,
			created0,
			created1,
			type,
			ip,
			sessionId,
		}: IActivityPaginate,
		user: IUserMeta,
	): Promise<IActivityPagingRes> {
		const conditions: Prisma.ActivityWhereInput[] = [
			{
				created: {
					gte: new Date(created0),
					lte: new Date(created1),
				},
			},
		]

		if (!user.permissions.includes(PERMISSION.ACTIVITY_VIEW_ALL)) {
			conditions.push({ createdById: user.id })
		}
		if (ip) {
			conditions.push({ ip })
		}
		if (type) {
			conditions.push({
				type: {
					equals: type,
					mode: 'insensitive',
				},
			})
		}
		if (sessionId) {
			conditions.push({
				sessionId: {
					equals: sessionId,
					mode: 'insensitive',
				},
			})
		}

		const docs = await db.activity.findMany({
			select: {
				id: true,
				created: true,
				createdById: true,
				description: true,
				device: true,
				ip: true,
				reference: true,
				type: true,
				sessionId: true,
			},
			where: { AND: conditions },
			take,
			orderBy: { created: 'desc' },
			cursor: cursor ? { id: cursor } : undefined,
			skip: cursor ? 1 : 0,
		})
		const hasNext = docs.length === take

		return {
			docs: docs,
			hasNext,
			nextCursor: hasNext ? docs[docs.length - 1].id : undefined,
		}
	},
}
