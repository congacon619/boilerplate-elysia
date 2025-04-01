import { Prisma } from '@prisma/client'
import { Elysia, t } from 'elysia'
import {
	ACTIVITY_TYPE,
	DOC_DETAIL,
	DOC_OPTIONS,
	ErrorResDto,
	IdDto,
	NotFoundException,
	PERMISSION,
	ROUTER,
	ResWrapper,
	UnauthorizedException,
	authErrors,
} from '../common'
import { castToRes, db, reqMeta } from '../config'
import {
	activityService,
	authCheck,
	permissionCheck,
	sessionService,
} from '../service'
import { SessionPaginateDto, SessionPagingResDto } from './dto'

export const sessionController = new Elysia({
	name: 'SessionController',
	detail: { tags: [DOC_OPTIONS.tags.session.name] },
	prefix: ROUTER.SESSION.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
	.get(
		'/',
		async ({
			currentUser,
			query: { created0, created1, ip, cursor, take, revoked },
		}) => {
			const conditions: Prisma.SessionWhereInput[] = [
				{
					created: {
						gte: new Date(created0),
						lte: new Date(created1),
					},
				},
			]

			if (!currentUser.permissions.includes(PERMISSION.SESSION_VIEW_ALL)) {
				conditions.push({ createdById: currentUser.id })
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

			return castToRes({
				docs: sessions,
				hasNext,
				nextCursor: hasNext ? sessions[sessions.length - 1].id : undefined,
			})
		},
		{
			beforeHandle: permissionCheck('SESSION.VIEW'),
			query: SessionPaginateDto,
			detail: {
				...DOC_DETAIL.SESSION_PAGINATE,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(SessionPagingResDto),
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.SESSION.REVOKE,
		async ({ params: { id }, currentUser, clientIp, userAgent }) => {
			const session = await db.session.findUnique({
				where: { id },
				select: { createdById: true },
			})

			if (!session) {
				throw new NotFoundException('exception.item-not-found', {
					args: { item: 'Session' },
				})
			}

			if (
				!currentUser.permissions.includes(PERMISSION.SESSION_REVOKE_ALL) &&
				session.createdById !== currentUser.id
			) {
				throw new UnauthorizedException('exception.permission-denied')
			}

			await Promise.all([
				sessionService.revoke(currentUser.id, [id]),
				activityService.create(
					ACTIVITY_TYPE.REVOKE_SESSION,
					{ sessionId: id },
					{ currentUser, clientIp, userAgent },
				),
			])
			return castToRes(null)
		},
		{
			beforeHandle: permissionCheck(PERMISSION.SESSION_REVOKE),
			params: IdDto,
			detail: {
				...DOC_DETAIL.SESSION_REVOKE,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Null()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
