import { Prisma, PrismaClient } from '@prisma/client'
import {
	ACTIVITY_TYPE,
	ActivityTypeMap,
	IUserMeta,
	PREFIX,
	token12,
} from '../common'
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
}
