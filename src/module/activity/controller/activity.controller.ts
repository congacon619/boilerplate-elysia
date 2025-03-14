import { Elysia } from 'elysia'
import {
	DOC_DETAIL,
	DOC_OPTIONS,
	PERMISSION,
	ROUTER,
	ResWrapper,
	authErrors,
} from '../../../common'
import { castToRes, reqMeta } from '../../../config'
import { authCheck, permissionCheck } from '../../user/auth.middleware'
import { activityService } from '../service'
import { ActivityPaginateDto, ActivityPagingResDto } from '../type'

export const activityController = new Elysia({
	name: 'ActivityController',
	detail: { tags: [DOC_OPTIONS.tags.activity.name] },
	prefix: ROUTER.ACTIVITY.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
	.get(
		'/',
		async ({ user, query }) =>
			castToRes(await activityService.paginate(query, user)),
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
