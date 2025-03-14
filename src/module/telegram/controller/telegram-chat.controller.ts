import { Elysia } from 'elysia'
import { DOC_OPTIONS, ROUTER } from '../../../common'
import { reqMeta } from '../../../config'
import { authCheck } from '../../user/auth.middleware'

export const telegramChatController = new Elysia({
	name: 'TelegramChatController',
	detail: { tags: [DOC_OPTIONS.tags.telegramChat.name] },
	prefix: ROUTER.TELEGRAM_CHAT.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
