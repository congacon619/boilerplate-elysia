import { Elysia, t } from 'elysia'
import {
	DOC_DETAIL,
	DOC_OPTIONS,
	ErrorResDto,
	IdsDto,
	PERMISSION,
	ROUTER,
	ResWrapper,
	authErrors,
} from '../../../common'
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
		detail: DOC_DETAIL.I18N_GET_ALL,
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
	.post(
		ROUTER.I18N.IMPORT,
		async ({ body }) => castToRes(await i18nService.import(body.file)),
		{
			beforeHandle: permissionCheck(PERMISSION.I18N_UPDATE),
			body: t.Object({
				file: t.File({ format: 'application/vnd.ms-excel' }),
			}),
			detail: DOC_DETAIL.I18N_IMPORT,
			response: {
				200: ResWrapper(t.Void()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.get(
		ROUTER.I18N.EXPORT,
		async () => {
			const buffer = await i18nService.export()
			const res = new Response(buffer)
			res.headers.set('Content-Type', 'application/vnd.ms-excel')
			res.headers.set(
				'Content-Disposition',
				`attachment; filename="translations_${new Date().getTime()}.xlsx"`,
			)
			return res
		},
		{
			beforeHandle: permissionCheck(PERMISSION.I18N_VIEW),
			detail: {
				...DOC_DETAIL.I18N_EXPORT,
				responses: {
					200: {
						description: 'File stream',
						content: {
							'application/vnd.ms-excel': {},
						},
					},
				},
			},
			response: {
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
