import { join } from 'node:path'
import { createPinoLogger, pino } from '@bogeychan/elysia-logger'
import { env } from './env'

export const logger = createPinoLogger({
	transport: {
		targets: [
			{
				target: 'pino-roll',
				options: {
					file: join('logs', 'log'),
					frequency: 'daily',
					mkdir: true,
					sync: false,
				},
				level: 'warn',
			},
			{
				target: 'pino-pretty',
				options: { colorize: true },
			},
		],
	},
	timestamp: pino.stdTimeFunctions.isoTime,
	level: env.LOG_LEVEL,
})

// export const redisLogger = logger.child({ service: APP_SERVICE.REDIS })
// export const postgresLogger = logger.child({ service: APP_SERVICE.POSTGRES })
// export const queueLogger = logger.child({ service: APP_SERVICE.QUEUE })
