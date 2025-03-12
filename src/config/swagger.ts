import { swagger } from '@elysiajs/swagger'
import type { Elysia } from 'elysia'
import { env } from './env'
import packageJson from '../../package.json'
import { DOC_OPTIONS } from '../common'

export const swaggerConfig = () => (app: Elysia) => {
	if (env.ENB_SWAGGER_UI) {
		return app.use(
			swagger({
				documentation: {
					info: { ...DOC_OPTIONS.info, version: packageJson.version },
					servers: [
						{
							url: `http://localhost:${env.PORT}`,
							description: 'Local server',
						},
					],
					tags: Object.values(DOC_OPTIONS.tags),
					components: {
						securitySchemes: {
							accessToken: {
								type: 'http',
								scheme: 'bearer',
								bearerFormat: 'JWT',
							},
							refreshToken: {
								type: 'http',
								scheme: 'bearer',
								bearerFormat: 'JWT',
							},
							apiKey: {
								type: 'apiKey',
								name: 'apiKey',
								in: 'header',
							},
						},
					},
				},
				version: packageJson.version,
				provider: 'scalar',
				scalarConfig: { theme: 'solarized' },
				path: env.SWAGGER_EP,
			}),
		)
	}
	return app
}
