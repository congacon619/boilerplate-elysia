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
import { telegramTemplateService } from '../service'
import { PaginateTeleTemplateResDto, UpsertTeleTemplateDto } from '../type'

export const telegramTemplateController = new Elysia({
	name: 'TelegramTemplateController',
	detail: { tags: [DOC_OPTIONS.tags.telegramTemplate.name] },
	prefix: ROUTER.TELEGRAM_TEMPLATE.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
	.get(
		'/',
		async ({ query }) =>
			castToRes(await telegramTemplateService.paginate(query)),
		{
			beforeHandle: permissionCheck(PERMISSION.TELEGRAM_TEMPLATE_VIEW),
			query: PaginationReqDto,
			detail: {
				...DOC_DETAIL.TELE_TEMPLATE_PAGINATE,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(PaginateTeleTemplateResDto),
				...authErrors,
			},
		},
	)
	.post(
		'/',
		async ({ body }) => castToRes(await telegramTemplateService.upsert(body)),
		{
			body: UpsertTeleTemplateDto,
			beforeHandle: permissionCheck(PERMISSION.TELEGRAM_TEMPLATE_UPDATE),
			detail: {
				...DOC_DETAIL.TELE_TEMPLATE_UPSERT,
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
		ROUTER.TELEGRAM_TEMPLATE.DEL,
		async ({ body }) => castToRes(await telegramTemplateService.del(body.ids)),
		{
			body: IdsDto,
			beforeHandle: permissionCheck(PERMISSION.TELEGRAM_TEMPLATE_DELETE),
			detail: {
				...DOC_DETAIL.TELE_TEMPLATE_DEL,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Void()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
