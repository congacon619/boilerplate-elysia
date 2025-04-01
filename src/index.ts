import cors from '@elysiajs/cors'
import { opentelemetry } from '@elysiajs/opentelemetry'
import { serverTiming } from '@elysiajs/server-timing'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { Elysia } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'
import { elysiaXSS } from 'elysia-xss'
import { elysiaHelmet } from 'elysiajs-helmet'
import { db, env, httpError, logger, swaggerConfig } from './config'
import {
	activityController,
	apiKeyController,
	authController,
	captchaController,
	fileController,
	ipWhitelistController,
	mfaController,
	miscController,
	settingController,
	userController,
} from './controller'
import { i18nController } from './module/i18n/controller'
import { permissionController } from './module/role/controller'
import { roleController } from './module/role/controller/role.controller'
import { sessionController } from './module/session/controller'
import { startupService } from './module/startup'
import {
	telegramBotController,
	telegramChatController,
	telegramTemplateController,
} from './module/telegram/controller'

try {
	await db.$connect()
	logger.info('DB Connected successfully!')
	await startupService.initRoleAndUser()
	await startupService.initSettings()

	const app = new Elysia()
		.use(rateLimit())
		.use(elysiaXSS({ as: 'global' }))
		.use(elysiaHelmet())
		.use(
			logger.into({
				autoLogging: {
					ignore(ctx) {
						return [env.SWAGGER_EP, env.BULL_BOARD_EP].some(a =>
							ctx.path.includes(a.replaceAll('/', '')),
						)
					},
				},
			}),
		)
		.use(
			cors({
				methods: env.CORS_ALLOW_METHOD ?? '*',
				origin: env.CORS_ALLOW_ORIGIN,
				allowedHeaders: env.CORS_ALLOW_HEADERS,
			}),
		)
		.use(
			opentelemetry({
				spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter())],
			}),
		)
		.use(serverTiming())
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
				.use(permissionController)
				.use(sessionController)
				.use(i18nController)
				.use(fileController)
				.use(ipWhitelistController)
				.use(roleController)
				.use(telegramBotController)
				.use(telegramChatController)
				.use(telegramTemplateController)
				.use(captchaController),
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
