import { Elysia, t } from 'elysia'
import { DOC_DETAIL, DOC_OPTIONS, PERMISSION, ROUTER } from '../../../common'
import {
	ErrorResDto,
	IdsDto,
	ResWrapper,
	authErrors,
} from '../../../common/type'
import { castToRes, reqMeta } from '../../../config'
import { authCheck, permissionCheck } from '../../user/auth.middleware'
import { i18nService } from '../service'
import { I18nPaginationDto, I18nUpsertDto, PaginateI18nResDto } from '../type'

export const i18nController = new Elysia({
	name: 'I18nController',
	detail: { tags: [DOC_OPTIONS.tags.i18n.name] },
	prefix: ROUTER.I18N.ROOT,
})
	.get('/', async ({ query }) => castToRes(await i18nService.paginate(query)), {
		query: I18nPaginationDto,
		detail: DOC_DETAIL.I18N_PAGINATE,
		response: {
			200: ResWrapper(PaginateI18nResDto),
			500: ErrorResDto,
		},
	})
	.use(reqMeta)
	.use(authCheck)
	.post('/', async ({ body }) => castToRes(await i18nService.upsert(body)), {
		body: I18nUpsertDto,
		beforeHandle: permissionCheck(PERMISSION.I18N_UPDATE),
		detail: {
			...DOC_DETAIL.I18N_UPSERT,
			security: [{ accessToken: [] }],
		},
		response: {
			200: ResWrapper(t.Void()),
			400: ErrorResDto,
			...authErrors,
		},
	})
	.post(
		ROUTER.I18N.DEL,
		async ({ body }) => castToRes(await i18nService.del(body.ids)),
		{
			body: IdsDto,
			beforeHandle: permissionCheck(PERMISSION.I18N_DELETE),
			detail: {
				...DOC_DETAIL.I18N_DEL,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Void()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
