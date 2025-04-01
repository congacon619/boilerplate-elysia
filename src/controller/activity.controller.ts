import { Prisma } from '@prisma/client'
import { Elysia } from 'elysia'
import {
	DOC_DETAIL,
	DOC_OPTIONS,
	PERMISSION,
	ROUTER,
	ResWrapper,
	authErrors,
} from '../common'
import { castToRes, db, reqMeta } from '../config'
import { authCheck, permissionCheck } from '../service'
import { ActivityPaginateDto, ActivityPagingResDto } from './dto'

export const activityController = new Elysia({
	name: 'ActivityController',
	detail: { tags: [DOC_OPTIONS.tags.activity.name] },
	prefix: ROUTER.ACTIVITY.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
	.get(
		'/',
		async ({
			currentUser,
			query: { cursor, take, created0, created1, type, ip, sessionId },
		}) => {
			const conditions: Prisma.ActivityWhereInput[] = [
				{
					created: {
						gte: new Date(created0),
						lte: new Date(created1),
					},
				},
			]

			if (!currentUser.permissions.includes(PERMISSION.ACTIVITY_VIEW_ALL)) {
				conditions.push({ createdById: currentUser.id })
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

			return castToRes({
				docs: docs,
				hasNext,
				nextCursor: hasNext ? docs[docs.length - 1].id : undefined,
			})
		},
		{
			beforeHandle: permissionCheck(PERMISSION.ACTIVITY_VIEW),
			query: ActivityPaginateDto,
			detail: {
				...DOC_DETAIL.ACTIVITY_PAGINATE,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(ActivityPagingResDto),
				...authErrors,
			},
		},
	)
