import cors from '@elysiajs/cors'
import { Elysia } from 'elysia'
import { env, logger, swaggerConfig } from './config'
import { authController } from './module/user/controller'

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
	.get('/env', () => env)
	.get('/', ctx => {
		ctx.log.error(ctx, 'Context')
		ctx.log.info(ctx.request, 'Request')
		return 'pino-pretty'
	})
	.listen(env.PORT)

logger.info(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
)
