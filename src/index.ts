import cors from '@elysiajs/cors'
import { Elysia } from 'elysia'
import { db, env, httpError, logger, swaggerConfig } from './config'
import { activityController } from './module/activity/controller'
import { apiKeyController } from './module/api-key/controller'
import { miscController } from './module/misc/controller'
import { settingController } from './module/setting/controller'
import { startupService } from './module/startup'
import {
	authController,
	mfaController,
	userController,
} from './module/user/controller'
import { permissionController } from './module/role/controller'

try {
	await db.$connect()
	logger.info('DB Connected successfully!')
	await startupService.initRoleAndUser()
	await startupService.initSettings()

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
		.use(httpError())
		.group(env.API_PREFIX, app =>
			app
				.use(authController)
				.use(activityController)
				.use(userController)
				.use(miscController)
				.use(mfaController)
				.use(apiKeyController)
				.use(settingController)
				.use(permissionController),
		)
	app.listen(env.PORT)

	logger.info(
		`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
	)
} catch (e) {
	logger.error('App start failed!')
	logger.error(e)
	process.exit()
}
