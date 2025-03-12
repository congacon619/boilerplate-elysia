import { Prisma, PrismaClient } from '@prisma/client'
import { ACTIVITY_TYPE, PREFIX, token12 } from '../../../common'
import { IReqMeta } from '../../../common/type'
import { db } from '../../../config'

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
}
