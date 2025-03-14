import { Elysia, t } from 'elysia'
import { DOC_DETAIL, DOC_OPTIONS, PERMISSION, ROUTER } from '../../../common'
import {
	ErrorResDto,
	IdDto,
	ResWrapper,
	authErrors,
} from '../../../common/type'
import { castToRes, reqMeta } from '../../../config'
import { authCheck, permissionCheck } from '../../user/auth.middleware'
import { sessionService } from '../service'
import { SessionPaginateDto, SessionPagingResDto } from '../type'

export const sessionController = new Elysia({
	name: 'SessionController',
	detail: { tags: [DOC_OPTIONS.tags.session.name] },
	prefix: ROUTER.SESSION.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
	.get(
		'/',
		async ({ user, query }) =>
			castToRes(await sessionService.paginate(query, user)),
		{
			beforeHandle: permissionCheck(PERMISSION.SESSION_VIEW),
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
		async ({ user, metadata, params }) =>
			castToRes(await sessionService.revokeSession(params.id, user, metadata)),
		{
			beforeHandle: permissionCheck(PERMISSION.SESSION_REVOKE),
			params: IdDto,
			detail: {
				...DOC_DETAIL.SESSION_REVOKE,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Void()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
