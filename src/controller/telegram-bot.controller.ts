import { Elysia, t } from 'elysia'
import {
	ACTIVITY_TYPE,
	DOC_DETAIL,
	DOC_OPTIONS,
	ErrorResDto,
	IdsDto,
	PREFIX,
	PaginationReqDto,
	ROUTER,
	ResWrapper,
	aes256Decrypt,
	aes256Encrypt,
	authErrors,
	token12,
} from '../common'
import { castToRes, db, logger, reqMeta } from '../config'
import { activityService, authCheck, permissionCheck } from '../service'
import { PaginateTeleBotResDto, UpsertTeleBotDto } from './dto'

export const telegramBotController = new Elysia({
	name: 'TelegramBotController',
	detail: { tags: [DOC_OPTIONS.tags.telegramBot.name] },
	prefix: ROUTER.TELEGRAM_BOT.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
	.get(
		'/',
		async ({ query: { take, skip } }) => {
			const [docs, count] = await Promise.all([
				db.telegramBot.findMany({
					take,
					skip,
				}),
				db.telegramBot.count(),
			])
			return castToRes({
				docs: await Promise.all(
					docs.map(async x => {
						let token: string = x.token
						try {
							token = await aes256Decrypt(x.token)
						} catch (error) {
							logger.error(`Wrong decrypt telegram bot token: ${x.id}`, error)
						}
						return { ...x, token: String(token) }
					}),
				),
				count,
			})
		},
		{
			beforeHandle: permissionCheck('TELE_BOT.VIEW'),
			query: PaginationReqDto,
			detail: {
				...DOC_DETAIL.TELE_BOT_PAGINATE,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(PaginateTeleBotResDto),
				...authErrors,
			},
		},
	)
	.post(
		'/',
		async ({ body, currentUser, clientIp, userAgent }) => {
			if (body.id) {
				await db.$transaction([
					db.telegramBot.update({
						where: { id: body.id },
						data: { ...body, token: await aes256Encrypt(body.token) },
						select: { id: true },
					}),
					activityService.create(
						ACTIVITY_TYPE.UPDATE_TELEGRAM_BOT,
						{ id: body.id },
						{ currentUser, clientIp, userAgent },
					),
				])
			} else {
				await db.$transaction(async tx => {
					const createData = await tx.telegramBot.create({
						data: {
							...body,
							id: token12(PREFIX.TELEGRAM_BOT),
							token: await aes256Encrypt(body.token),
						},
						select: { id: true },
					})
					await activityService.create(
						ACTIVITY_TYPE.CREATE_TELEGRAM_BOT,
						{ id: createData.id },
						{ currentUser, clientIp, userAgent },
						tx,
					)
				})
			}
			return castToRes(null)
		},
		{
			body: UpsertTeleBotDto,
			beforeHandle: permissionCheck('TELE_BOT.UPDATE'),
			detail: {
				...DOC_DETAIL.TELE_BOT_UPSERT,
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
		ROUTER.TELEGRAM_BOT.DEL,
		async ({ body: { ids }, currentUser, clientIp, userAgent }) => {
			await db.$transaction([
				db.telegramBot.deleteMany({
					where: { id: { in: ids } },
				}),
				activityService.create(
					ACTIVITY_TYPE.DEL_TELEGRAM_BOT,
					{ botIds: ids },
					{ currentUser, clientIp, userAgent },
				),
			])
			return castToRes(null)
		},
		{
			body: IdsDto,
			beforeHandle: permissionCheck('TELE_BOT.DELETE'),
			detail: {
				...DOC_DETAIL.TELE_BOT_DEL,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Null()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
