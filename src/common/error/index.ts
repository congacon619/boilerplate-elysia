import { HTTP_STATUS } from '../constant'
import { I18nPath } from '../../types/i18next'

export class AppException extends Error {
	public readonly detail?: { errors?: unknown; args?: unknown }
	public readonly status: HTTP_STATUS
	public readonly code: I18nPath

	constructor(
		code: I18nPath,
		status: HTTP_STATUS = HTTP_STATUS.HTTP_500_INTERNAL_SERVER_ERROR,
		detail?: { errors?: unknown; args?: unknown },
	) {
		super()
		this.status = status
		this.detail = detail
		this.code = code
	}
}
