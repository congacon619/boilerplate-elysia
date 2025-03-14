import { logger, teleWorker } from '../../../config'

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
