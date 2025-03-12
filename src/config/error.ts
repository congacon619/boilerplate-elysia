import Elysia from 'elysia'
import {
	AppException,
	DEFAULT_LANGUAGE,
	HTTP_STATUS,
	RES_CODE,
} from '../common'
import { I18nPath, IErrorRes } from '../common/type'
import { i18n } from './i18n'
import { logger } from './logger'

export const httpError = () => (app: Elysia) =>
	app
		.error({ ELYSIA_HTTP_ERROR: AppException })
		.onError(async ({ code, error, set, request }) => {
			const lng = set.headers['accept-language'] ?? DEFAULT_LANGUAGE

			const handleError = async (
				message: string,
				status?: number,
				code = RES_CODE.ISE,
				detail?: any,
			) => {
				return {
					code,
					message: i18n(message as I18nPath, { lng, args: detail?.args }),
					t: new Date().toISOString(),
					statusCode: status ?? HTTP_STATUS.HTTP_500_INTERNAL_SERVER_ERROR,
					errors: detail?.errors,
				} satisfies IErrorRes
			}

			switch (code) {
				case 'ELYSIA_HTTP_ERROR':
					return await handleError(
						error.code,
						error.status,
						RES_CODE.ISE,
						error.detail,
					)
				case 'VALIDATION':
					return await handleError(
						RES_CODE.VALIDATION_ERROR,
						HTTP_STATUS.HTTP_400_BAD_REQUEST,
						RES_CODE.VALIDATION_ERROR,
						{
							errors: error.all.map(x => x.summary),
						},
					)
				case 'NOT_FOUND':
					return await handleError(
						RES_CODE.NOT_FOUND,
						HTTP_STATUS.HTTP_404_NOT_FOUND,
						RES_CODE.NOT_FOUND,
						{ errors: { path: request.url } },
					)
				default:
					logger.error(error)
					return await handleError(
						RES_CODE.ISE,
						HTTP_STATUS.HTTP_500_INTERNAL_SERVER_ERROR,
						RES_CODE.ISE,
						{ errors: error },
					)
			}
		})
