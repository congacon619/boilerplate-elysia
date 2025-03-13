import { Elysia, t } from 'elysia'
import { DOC_DETAIL, DOC_OPTIONS, PERMISSION, ROUTER } from '../../../common'
import { PaginationReqDto, ResWrapper, authErrors } from '../../../common/type'
import { castToRes, env, reqMeta } from '../../../config'
import { authCheck, permissionCheck } from '../auth.middleware'
import { userService } from '../service'
import { PaginateUserResDto, UserUpsertDto } from '../type'

export const userController = new Elysia({
	name: 'UserController',
	detail: { tags: [DOC_OPTIONS.tags.user.name] },
	prefix: env.API_PREFIX,
})
	.use(reqMeta)
	.use(authCheck)
	.get(
		ROUTER.USER.ROOT,
		async ({ query }) => castToRes(await userService.paginate(query)),
		{
			beforeHandle: permissionCheck(PERMISSION.USER_VIEW),
			query: PaginationReqDto,
			detail: {
				...DOC_DETAIL.USER_PAGINATE,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(PaginateUserResDto),
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.USER.ROOT,
		async ({ body, user, metadata }) =>
			castToRes(await userService.upsert(body, user, metadata)),
		{
			beforeHandle: permissionCheck(PERMISSION.USER_UPDATE),
			body: UserUpsertDto,
			detail: {
				...DOC_DETAIL.USER_UPSERT,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Void()),
				...authErrors,
			},
		},
	)
