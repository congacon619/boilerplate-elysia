import { Queue } from 'bullmq'
import { ITelegramMessage, QUEUE } from '../common'
import { env } from './env'

export const teleQueue = new Queue<ITelegramMessage>(QUEUE.TELEGRAM_QUEUE, {
	connection: {
		url: env.REDIS_URI,
		password: env.REDIS_PASSWORD,
	},
})
