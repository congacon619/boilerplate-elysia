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
import { telegramChatService } from '../service'
import { PaginateTelegramChatResDto, UpsertTelegramChatDto } from '../type'

export const telegramChatController = new Elysia({
	name: 'TelegramChatController',
	detail: { tags: [DOC_OPTIONS.tags.telegramChat.name] },
	prefix: ROUTER.TELEGRAM_CHAT.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
	.get(
		'/',
		async ({ query }) => castToRes(await telegramChatService.paginate(query)),
		{
			beforeHandle: permissionCheck(PERMISSION.TELEGRAM_CHAT_VIEW),
			query: PaginationReqDto,
			detail: {
				...DOC_DETAIL.TELE_CHAT_PAGINATE,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(PaginateTelegramChatResDto),
				...authErrors,
			},
		},
	)
	.post(
		'/',
		async ({ body }) => castToRes(await telegramChatService.upsert(body)),
		{
			body: UpsertTelegramChatDto,
			beforeHandle: permissionCheck(PERMISSION.TELEGRAM_CHAT_UPDATE),
			detail: {
				...DOC_DETAIL.TELE_CHAT_UPSERT,
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
		ROUTER.TELEGRAM_CHAT.DEL,
		async ({ body }) => castToRes(await telegramChatService.del(body.ids)),
		{
			body: IdsDto,
			beforeHandle: permissionCheck(PERMISSION.TELEGRAM_CHAT_DELETE),
			detail: {
				...DOC_DETAIL.TELE_CHAT_DEL,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Void()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
