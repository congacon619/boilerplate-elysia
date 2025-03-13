import { Elysia } from 'elysia'
import { RES_CODE } from '../common'
import { env } from './env'

export const httpResponse = () => (app: Elysia) =>
	app.onAfterHandle(async ({ response, path }) => {
		const ignorePaths: string[] = [
			env.ASYNC_API_EP,
			env.REDOC_EP,
			env.SWAGGER_EP,
			env.SWAGGER_STATS_EP,
			env.METRIC_EP,
			env.BULL_BOARD_EP,
		]
		if (ignorePaths.some(a => path.includes(a.replaceAll('/', '')))) {
			return
		}
		const isJson: boolean = typeof response === 'object'
		if (isJson) {
			const dataRes = {
				data: response,
				code: RES_CODE.SUCCESS,
				t: new Date().toISOString(),
			}
			return new Response(JSON.stringify(dataRes), {
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
				},
			})
		}
		return new Response(response?.toString() ?? '', {
			headers: {
				'Content-Type': `"text/plain"; charset=utf-8`,
			},
		})
	})
