import { Elysia } from 'elysia'
import { logger } from './logger'

export const gracefulShutdown = (app: Elysia): void => {
	logger.warn('✅  Shutdown success')
	// logger.warn(chalk.yellowBright('Shutting down gracefully (2 seconds) ....'))
	// // disconnect DB and other services...
	// redisClient
	// 	.disconnect()
	// 	.then(() => redisLogger.warn(chalk.yellow('✅  Shutdown redis success')))
	// 	.catch(e =>
	// 		redisLogger.error(`❌  Shutdown redis failed: ${JSON.stringify(e)}`),
	// 	)
	// pgPool
	// 	.end()
	// 	.then(() =>
	// 		postgresLogger.warn(chalk.yellow('✅  Shutdown postgres success')),
	// 	)
	// 	.catch(e =>
	// 		postgresLogger.error(
	// 			`❌  Shutdown postgres failed: ${JSON.stringify(e)}`,
	// 		),
	// 	)
	//
	// sendEmailQueue
	// 	.close()
	// 	.then(() =>
	// 		queueLogger.warn(chalk.yellow('✅  Shutdown send email queue success')),
	// 	)
	// 	.catch(e =>
	// 		queueLogger.error(
	// 			`❌  Shutdown send email queue failed: ${JSON.stringify(e)}`,
	// 		),
	// 	)
	//
	// sendEmailWorker
	// 	.close()
	// 	.then(() =>
	// 		queueLogger.warn(chalk.yellow('✅  Shutdown send email worker success')),
	// 	)
	// 	.catch(e =>
	// 		queueLogger.error(
	// 			`❌  Shutdown send email worker failed: ${JSON.stringify(e)}`,
	// 		),
	// 	)

	setTimeout((): void => {
		logger.warn('✅  Shutdown success')
		process.exit()
	}, 1000)
}
