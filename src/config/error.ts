import Elysia from 'elysia'
import {
	AppException,
	DEFAULT_LANGUAGE,
	HTTP_STATUS,
	I18nPath,
	IErrorRes,
	RES_CODE,
} from '../common'
import { i18n } from './i18n'
import { logger } from './logger'

export const httpError = () => (app: Elysia) =>
	app.onError(async ({ code, error, set, request }) => {
		const lng = set.headers['accept-language'] ?? DEFAULT_LANGUAGE

		const handleError = (
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
		if (error instanceof AppException) {
			return handleError(error.code, error.status, RES_CODE.ISE, error.detail)
		}
		switch (code) {
			case 'VALIDATION':
				return handleError(
					RES_CODE.VALIDATION_ERROR,
					HTTP_STATUS.HTTP_400_BAD_REQUEST,
					RES_CODE.VALIDATION_ERROR,
					{
						errors: error.all.map(x => x.summary),
					},
				)
			case 'NOT_FOUND':
				return handleError(
					RES_CODE.NOT_FOUND,
					HTTP_STATUS.HTTP_404_NOT_FOUND,
					RES_CODE.NOT_FOUND,
					{ errors: { path: request.url } },
				)
			default:
				logger.error(error)
				return handleError(
					RES_CODE.ISE,
					HTTP_STATUS.HTTP_500_INTERNAL_SERVER_ERROR,
					RES_CODE.ISE,
					{ errors: error },
				)
		}
	})
