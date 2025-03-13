import { Elysia, t } from 'elysia'
import { DOC_DETAIL, DOC_OPTIONS, PERMISSION, ROUTER } from '../../../common'
import {
	ErrorResDto,
	PaginationReqDto,
	ResWrapper,
	authErrors,
} from '../../../common/type'
import { castToRes, reqMeta } from '../../../config'
import { authCheck, permissionCheck } from '../../user/auth.middleware'
import { apiKeyService } from '../service/api-key.service'
import {
	PaginateApiKeyResDto,
	ResetApiKeyDto,
	UpsertApiKeyDto,
	UpsertApiKeyResDto,
} from '../type'

export const apiKeyController = new Elysia({
	name: 'ApiKeyController',
	detail: { tags: [DOC_OPTIONS.tags.apiKey.name] },
	prefix: ROUTER.API_KEY.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
	.get(
		'/',
		async ({ query, user }) =>
			castToRes(await apiKeyService.paginate(query, user)),
		{
			beforeHandle: permissionCheck(PERMISSION.API_KEY_VIEW),
			query: PaginationReqDto,
			detail: {
				...DOC_DETAIL.API_KEY_PAGINATE,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(PaginateApiKeyResDto),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.post(
		'/',
		async ({ body, user, metadata }) =>
			castToRes(await apiKeyService.upsert(body, user, metadata)),
		{
			beforeHandle: permissionCheck(PERMISSION.API_KEY_UPDATE),
			body: UpsertApiKeyDto,
			detail: {
				...DOC_DETAIL.API_KEY_UPSERT,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(UpsertApiKeyResDto),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.API_KEY.RESET,
		async ({ user, metadata, params }) =>
			castToRes(await apiKeyService.reset(params.id, user, metadata)),
		{
			beforeHandle: permissionCheck(PERMISSION.API_KEY_UPDATE),
			params: t.Object({ id: t.String() }),
			detail: {
				...DOC_DETAIL.API_KEY_RESET,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(ResetApiKeyDto),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
