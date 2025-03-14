import { Elysia } from 'elysia'
import { DOC_OPTIONS, ROUTER } from '../../../common'
import { reqMeta } from '../../../config'
import { authCheck } from '../../user/auth.middleware'

export const telegramBotController = new Elysia({
	name: 'TelegramBotController',
	detail: { tags: [DOC_OPTIONS.tags.telegramBot.name] },
	prefix: ROUTER.TELEGRAM_BOT.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
