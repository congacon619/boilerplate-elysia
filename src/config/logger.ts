import { createPinoLogger, pino } from '@bogeychan/elysia-logger'
import { env } from './env'
import 'pino-roll'
import 'pino-pretty'

export const logger = createPinoLogger({
	transport: {
		targets: [
			{
				target: 'pino-roll',
				options: {
					file: 'logs/log',
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
