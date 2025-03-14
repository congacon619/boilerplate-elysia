import { Elysia, t } from 'elysia'
import {
	DOC_DETAIL,
	DOC_OPTIONS,
	PERMISSION,
	PaginationReqDto,
	ROUTER,
	ResWrapper,
	authErrors,
} from '../../../common'
import { castToRes, reqMeta } from '../../../config'
import { authCheck, permissionCheck } from '../auth.middleware'
import { userService } from '../service'
import { PaginateUserResDto, UserUpsertDto } from '../type'

export const userController = new Elysia({
	name: 'UserController',
	detail: { tags: [DOC_OPTIONS.tags.user.name] },
	prefix: ROUTER.USER.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
	.get('/', async ({ query }) => castToRes(await userService.paginate(query)), {
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
	})
	.post(
		'/',
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
