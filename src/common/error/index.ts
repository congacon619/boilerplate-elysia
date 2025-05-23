import { HTTP_STATUS } from '../constant'
import { I18nPath } from '../type'

export class CoreErr extends Error {
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

export class BadReqErr extends CoreErr {
	constructor(code: I18nPath, detail?: { errors?: unknown; args?: unknown }) {
		super(code, HTTP_STATUS.HTTP_400_BAD_REQUEST, detail)
	}
}

export class NotFoundErr extends CoreErr {
	constructor(code: I18nPath, detail?: { errors?: unknown; args?: unknown }) {
		super(code, HTTP_STATUS.HTTP_404_NOT_FOUND, detail)
	}
}

export class UnAuthErr extends CoreErr {
	constructor(code: I18nPath, detail?: { errors?: unknown; args?: unknown }) {
		super(code, HTTP_STATUS.HTTP_401_UNAUTHORIZED, detail)
	}
}
