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
import { telegramBotService } from '../service'
import { PaginateTelegramBotResDto, UpsertTelegramBotDto } from '../type'

export const telegramBotController = new Elysia({
	name: 'TelegramBotController',
	detail: { tags: [DOC_OPTIONS.tags.telegramBot.name] },
	prefix: ROUTER.TELEGRAM_BOT.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
	.get(
		'/',
		async ({ query }) => castToRes(await telegramBotService.paginate(query)),
		{
			beforeHandle: permissionCheck(PERMISSION.TELEGRAM_BOT_VIEW),
			query: PaginationReqDto,
			detail: {
				...DOC_DETAIL.TELE_BOT_PAGINATE,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(PaginateTelegramBotResDto),
				...authErrors,
			},
		},
	)
	.post(
		'/',
		async ({ body, user, metadata }) =>
			castToRes(await telegramBotService.upsert(body, user, metadata)),
		{
			body: UpsertTelegramBotDto,
			beforeHandle: permissionCheck(PERMISSION.TELEGRAM_BOT_UPDATE),
			detail: {
				...DOC_DETAIL.TELE_BOT_UPSERT,
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
		ROUTER.TELEGRAM_BOT.DEL,
		async ({ body, user, metadata }) =>
			castToRes(await telegramBotService.del(body.ids, user, metadata)),
		{
			body: IdsDto,
			beforeHandle: permissionCheck(PERMISSION.TELEGRAM_BOT_DELETE),
			detail: {
				...DOC_DETAIL.TELE_BOT_DEL,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Void()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
