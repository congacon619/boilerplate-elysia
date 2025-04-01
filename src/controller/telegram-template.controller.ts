import { Elysia, t } from 'elysia'
import { InlineKeyboardButton } from 'node-telegram-bot-api'
import {
	DOC_DETAIL,
	DOC_OPTIONS,
	ErrorResDto,
	IdsDto,
	PREFIX,
	PaginationReqDto,
	ROUTER,
	ResWrapper,
	authErrors,
	token12,
} from '../common'
import { castToRes, db, reqMeta } from '../config'
import { authCheck, permissionCheck, telegramService } from '../service'
import {
	PaginateTeleTemplateResDto,
	SendTelegramMessageDto,
	SendTemplateDto,
	UpsertTeleTemplateDto,
} from './dto'

export const telegramTemplateController = new Elysia({
	name: 'TelegramTemplateController',
	detail: { tags: [DOC_OPTIONS.tags.telegramTemplate.name] },
	prefix: ROUTER.TELEGRAM_TEMPLATE.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
	.get(
		'/',
		async ({ query: { take, skip } }) => {
			const [docs, count] = await Promise.all([
				db.telegramTemplate.findMany({
					take,
					skip,
				}),
				db.telegramTemplate.count(),
			])
			return castToRes({
				docs,
				count,
			})
		},
		{
			beforeHandle: permissionCheck('TELE_TEMPLATE.VIEW'),
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
		async ({
			body: { id, name, description, message, videos, photos, buttons },
		}) => {
			if (id) {
				await db.telegramTemplate.update({
					where: { id },
					data: {
						name,
						description,
						message,
						videos: videos?.length ? videos : [],
						photos: photos?.length ? photos : [],
						buttons: buttons?.length ? buttons : [],
					},
					select: { id: true },
				})
			} else {
				await db.telegramTemplate.create({
					data: {
						name,
						description,
						message,
						videos: videos?.length ? videos : [],
						photos: photos?.length ? photos : [],
						buttons: buttons?.length ? buttons : [],
						id: token12(PREFIX.TELEGRAM_TEMPLATE),
					},
					select: { id: true },
				})
			}
			return castToRes(null)
		},
		{
			body: UpsertTeleTemplateDto,
			beforeHandle: permissionCheck('TELE_TEMPLATE.UPDATE'),
			detail: {
				...DOC_DETAIL.TELE_TEMPLATE_UPSERT,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Null()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.TELEGRAM_TEMPLATE.DEL,
		async ({ body: { ids } }) => {
			await db.telegramTemplate.deleteMany({
				where: { id: { in: ids } },
			})
			return castToRes(null)
		},
		{
			body: IdsDto,
			beforeHandle: permissionCheck('TELE_TEMPLATE.DELETE'),
			detail: {
				...DOC_DETAIL.TELE_TEMPLATE_DEL,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Null()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.TELEGRAM_TEMPLATE.SEND,
		async ({ body }) => {
			const [template, chats] = await Promise.all([
				db.telegramTemplate.findUnique({
					where: { id: body.telegramTemplateId },
				}),
				db.telegramChat.findMany({
					where: { id: { in: body.telegramChatIds } },
				}),
			])
			if (!template || !chats.length) {
				return castToRes(null)
			}

			await telegramService.jobSendMessage({
				...template,
				chatIds: chats.map(x => x.chatId),
				botId: body.telegramBotId,
				reply_markup: {
					inline_keyboard:
						template.buttons as unknown as InlineKeyboardButton[][],
				},
			})
			return castToRes(null)
		},
		{
			body: SendTemplateDto,
			beforeHandle: permissionCheck('TELE_TEMPLATE.SEND'),
			detail: {
				...DOC_DETAIL.TELE_TEMPLATE_SEND,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Null()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.TELEGRAM_TEMPLATE.MANUAL_SEND,
		async ({ body }) => {
			await telegramService.jobSendMessage(body)
			return castToRes(null)
		},
		{
			body: SendTelegramMessageDto,
			beforeHandle: permissionCheck('TELE_TEMPLATE.SEND'),
			detail: {
				...DOC_DETAIL.TELE_SEND_MANUAL,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Null()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
