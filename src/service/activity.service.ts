import { Prisma, PrismaClient } from '@prisma/client'
import {
	ACTIVITY_TYPE,
	IUserMeta,
	PERMISSION,
	PREFIX,
	token12,
} from '../common'
import { ActivityTypeMap } from '../common'
import { db } from '../config'

export const activityService = {
	create<T extends ACTIVITY_TYPE>(
		type: T,
		reference: ActivityTypeMap[T],
		session: {
			clientIp: string
			userAgent: string
			currentUser: Pick<IUserMeta, 'sessionId' | 'id'>
		},
		tx?: Omit<
			PrismaClient,
			'$on' | '$transaction' | '$connect' | '$disconnect' | '$use' | '$extends'
		>,
	): Prisma.PrismaPromise<{
		id: string
	}> {
		return (tx || db).activity.create({
			data: {
				id: token12(PREFIX.ACTIVITY),
				type,
				ip: session.clientIp,
				device: session.userAgent,
				sessionId: session.currentUser.sessionId,
				createdById: session.currentUser.id,
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
