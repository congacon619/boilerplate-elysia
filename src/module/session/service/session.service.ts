import { Prisma } from '@prisma/client'
import { db, tokenCache } from '../../../config'

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
}
