import { Elysia } from 'elysia'
import { DOC_DETAIL, DOC_OPTIONS, PERMISSION, ROUTER } from '../../../common'
import { authErrors } from '../../../common/type'
import { env, reqMeta } from '../../../config'
import { authCheck, permissionCheck } from '../../user/auth.middleware'
import { activityService } from '../service'
import { ActivityPaginateDto, ActivityPagingResDto } from '../type'

export const activityController = new Elysia({
	name: 'ActivityController',
	detail: { tags: [DOC_OPTIONS.tags.activity.name] },
	prefix: env.API_PREFIX,
})
	.use(reqMeta)
	.use(authCheck)
	.get(
		ROUTER.ACTIVITY.ROOT,
		({ user, query }) => activityService.paginate(query, user),
		{
			beforeHandle: permissionCheck(PERMISSION.ACTIVITY_VIEW),
			query: ActivityPaginateDto,
			detail: {
				...DOC_DETAIL.ACTIVITY_PAGINATE,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ActivityPagingResDto,
				...authErrors,
			},
		},
	)
