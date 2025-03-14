import { Prisma } from '@prisma/client'
import {
	ACTIVITY_TYPE,
	IReqMeta,
	NotFoundException,
	PERMISSION,
	UnauthorizedException,
} from '../../../common'
import { db, tokenCache } from '../../../config'
import { activityService } from '../../activity/service'
import { IUserMeta } from '../../user/type'
import { ISessionPaginate, ISessionPagingRes } from '../type'

export const sessionService = {
	async revoke(userId: string, sessionIds: string[] = []): Promise<void> {
		const whereCondition: Prisma.SessionWhereInput = {
			createdById: userId,
			revoked: { not: { equals: true } },
		}

		if (sessionIds.length > 0) {
			whereCondition.id = { in: sessionIds }
		}

		const sessions = await db.session.findMany({
			where: whereCondition,
			select: { id: true },
		})

		if (sessions.length > 0) {
			const sessionIds = sessions.map(session => session.id)
			await Promise.all([
				db.session.updateMany({
					where: { id: { in: sessionIds } },
					data: { revoked: true },
				}),
				tokenCache.delete(sessionIds),
			])
		}
	},

	async paginate(
		{ cursor, take, created0, created1, ip, revoked }: ISessionPaginate,
		user: IUserMeta,
	): Promise<ISessionPagingRes> {
		const conditions: Prisma.SessionWhereInput[] = [
			{
				created: {
					gte: new Date(created0),
					lte: new Date(created1),
				},
			},
		]

		if (!user.permissions.includes(PERMISSION.SESSION_VIEW_ALL)) {
			conditions.push({ createdById: user.id })
		}

		if (ip) {
			conditions.push({ ip })
		}

		if (revoked !== undefined) {
			conditions.push({ revoked })
		}

		const sessions = await db.session.findMany({
			select: {
				id: true,
				created: true,
				ip: true,
				revoked: true,
				createdById: true,
				expired: true,
			},
			where: { AND: conditions },
			take,
			orderBy: { created: 'desc' },
			cursor: cursor ? { id: cursor } : undefined,
			skip: cursor ? 1 : 0,
		})
		const hasNext = sessions.length === take

		return {
			docs: sessions,
			hasNext,
			nextCursor: hasNext ? sessions[sessions.length - 1].id : undefined,
		}
	},

	async revokeSession(
		sessionId: string,
		user: IUserMeta,
		meta: IReqMeta,
	): Promise<void> {
		const session = await db.session.findUnique({
			where: { id: sessionId },
			select: { createdById: true },
		})

		if (!session) {
			throw new NotFoundException('exception.item-not-found', {
				args: { item: 'Session' },
			})
		}

		if (
			!user.permissions.includes(PERMISSION.SESSION_REVOKE_ALL) &&
			session.createdById !== user.id
		) {
			throw new UnauthorizedException('exception.permission-denied')
		}

		await Promise.all([
			sessionService.revoke(user.id, [sessionId]),
			activityService.create({
				type: ACTIVITY_TYPE.REVOKE_SESSION,
				meta,
				user,
				reference: { sessionId },
			}),
		])
	},
}
