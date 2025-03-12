import cors from '@elysiajs/cors'
import { Elysia } from 'elysia'
import { db, env, logger, swaggerConfig } from './config'
import { startupService } from './module/startup'
import { authController } from './module/user/controller'

try {
	await db.$connect()
	logger.info('DB Connected successfully!')
	await startupService.initRoleAndUser()

	const app = new Elysia()
		.use(
			logger.into({
				autoLogging: {
					ignore(ctx) {
						return [
							env.ASYNC_API_EP,
							env.REDOC_EP,
							env.SWAGGER_EP,
							env.SWAGGER_STATS_EP,
							env.METRIC_EP,
							env.BULL_BOARD_EP,
						].some(a => ctx.path.includes(a.replaceAll('/', '')))
					},
				},
			}),
		)
		.use(
			cors({
				methods: env.CORS_ALLOW_METHOD ?? '*',
				origin: env.CORS_ALLOW_ORIGIN,
				allowedHeaders: env.CORS_ALLOW_HEADERS,
				preflight: false,
			}),
		)
		.use(swaggerConfig())
		.use(authController)

	process.on('SIGINT', app.stop)
	process.on('SIGTERM', app.stop)
	app.listen(env.PORT)

	logger.info(
		`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
	)
} catch (e) {
	logger.error('App start failed!')
	logger.error(e)
	process.exit()
}
