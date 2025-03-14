import { Job, Queue, Worker } from 'bullmq'
import { ITelegramMessage, QUEUE } from '../common'
import { telegramService } from '../module/telegram/service/telegram.service'
import { env } from './env'

export const teleQueue = new Queue<ITelegramMessage>(QUEUE.TELEGRAM_QUEUE, {
	connection: {
		url: env.REDIS_URI,
		password: env.REDIS_PASSWORD,
	},
})
export const teleWorker = new Worker<ITelegramMessage, void>(
	QUEUE.TELEGRAM_QUEUE,
	async (job: Job<ITelegramMessage>) =>
		await telegramService.sendMessage(job.data),
)
