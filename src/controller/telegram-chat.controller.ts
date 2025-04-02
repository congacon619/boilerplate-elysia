import { Elysia, t } from 'elysia'
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
import { authCheck, permissionCheck } from '../service'
import { PaginateTeleChatResDto, UpsertTeleChatDto } from './dto'

export const telegramChatController = new Elysia({
	name: 'TelegramChatController',
	detail: { tags: [DOC_OPTIONS.tags.telegramChat.name] },
	prefix: ROUTER.TELEGRAM_CHAT.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
	.get(
		'/',
		async ({ query: { take, skip } }) => {
			const [docs, count] = await Promise.all([
				db.telegramChat.findMany({
					take,
					skip,
				}),
				db.telegramChat.count(),
			])
			return castToRes({
				docs,
				count,
			})
		},
		{
			beforeHandle: permissionCheck('TELE_CHAT.VIEW'),
			query: PaginationReqDto,
			detail: {
				...DOC_DETAIL.TELE_CHAT_PAGINATE,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(PaginateTeleChatResDto),
				...authErrors,
			},
		},
	)
	.post(
		'/',
		async ({ body }) => {
			if (body.id) {
				await db.telegramChat.update({
					where: { id: body.id },
					data: body,
					select: { id: true },
				})
			} else {
				await db.telegramChat.create({
					data: {
						...body,
						id: token12(PREFIX.TELEGRAM_CHAT),
					},
					select: { id: true },
				})
			}
			return castToRes(null)
		},
		{
			body: UpsertTeleChatDto,
			beforeHandle: permissionCheck('TELE_CHAT.UPDATE'),
			detail: {
				...DOC_DETAIL.TELE_CHAT_UPSERT,
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
		ROUTER.TELEGRAM_CHAT.DEL,
		async ({ body: { ids } }) => {
			await db.telegramChat.deleteMany({
				where: { id: { in: ids } },
			})
			return castToRes(null)
		},
		{
			body: IdsDto,
			beforeHandle: permissionCheck('TELE_CHAT.DELETE'),
			detail: {
				...DOC_DETAIL.TELE_CHAT_DEL,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Null()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
