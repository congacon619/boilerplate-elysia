import { Job, Worker } from 'bullmq'
import { ITelegramMessage, QUEUE } from '../../../common'
import { env, logger } from '../../../config'
import { telegramService } from './telegram.service'

export const teleWorker = new Worker<ITelegramMessage, void>(
	QUEUE.TELEGRAM_QUEUE,
	async (job: Job<ITelegramMessage>) =>
		await telegramService.sendMessage(job.data),
	{
		connection: {
			url: env.REDIS_URI,
			password: env.REDIS_PASSWORD,
		},
		removeOnComplete: { count: 1000 },
		removeOnFail: { count: 5000 },
	},
)

teleWorker.on('completed', () => {
	logger.warn('Telegram worker task completed')
})
teleWorker.on('failed', (_, error, prev) => {
	logger.error('Telegram worker failed with error', error)
	logger.error(error)
	logger.error(prev)
})
teleWorker.on('error', err => {
	logger.error('Telegram worker error')
	logger.error(err)
})
