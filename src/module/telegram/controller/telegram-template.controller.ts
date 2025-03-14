import { Elysia } from 'elysia'
import { DOC_OPTIONS, ROUTER } from '../../../common'
import { reqMeta } from '../../../config'
import { authCheck } from '../../user/auth.middleware'

export const telegramTemplateController = new Elysia({
	name: 'TelegramTemplateController',
	detail: { tags: [DOC_OPTIONS.tags.telegramTemplate.name] },
	prefix: ROUTER.TELEGRAM_TEMPLATE.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
