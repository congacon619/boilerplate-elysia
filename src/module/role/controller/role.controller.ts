import { Elysia, t } from 'elysia'
import {
	DOC_DETAIL,
	DOC_OPTIONS,
	ErrorResDto,
	IdsDto,
	PERMISSION,
	PaginationReqDto,
	ROUTER,
	ResWrapper,
	authErrors,
} from '../../../common'
import { castToRes, reqMeta } from '../../../config'
import { authCheck, permissionCheck } from '../../user/auth.middleware'
import { roleService } from '../service'
import { PaginateRoleResDto, UpsertRoleDto } from '../type'

export const roleController = new Elysia({
	name: 'RoleController',
	detail: { tags: [DOC_OPTIONS.tags.role.name] },
	prefix: ROUTER.ROLE.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
	.get('/', async ({ query }) => castToRes(await roleService.paginate(query)), {
		beforeHandle: permissionCheck(PERMISSION.ROLE_VIEW),
		query: PaginationReqDto,
		detail: {
			...DOC_DETAIL.ROLE_PAGINATE,
			security: [{ accessToken: [] }],
		},
		response: {
			200: ResWrapper(PaginateRoleResDto),
			...authErrors,
		},
	})
	.post(
		'/',
		async ({ body, user, metadata }) =>
			castToRes(await roleService.upsert(body, user, metadata)),
		{
			body: UpsertRoleDto,
			beforeHandle: permissionCheck(PERMISSION.ROLE_UPDATE),
			detail: {
				...DOC_DETAIL.ROLE_UPSERT,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Void()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.ROLE.DEL,
		async ({ body, user, metadata }) =>
			castToRes(await roleService.del(body.ids, user, metadata)),
		{
			body: IdsDto,
			beforeHandle: permissionCheck(PERMISSION.ROLE_DELETE),
			detail: {
				...DOC_DETAIL.ROLE_DEL,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Void()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
