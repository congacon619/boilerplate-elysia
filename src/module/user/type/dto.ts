import { t } from 'elysia'
import { LOGIN_RES_TYPE, MFA_METHOD } from '../constant'

export const LoginDto = t.Object({
	username: t.String({ minLength: 1 }),
	password: t.String({ minLength: 1 }),
})

export type ILogin = typeof LoginDto.static

export const UserResDto = t.Object({
	id: t.String(),
	username: t.String(),
	mfaTotpEnabled: t.Boolean(),
	mfaTelegramEnabled: t.Boolean(),
	telegramUsername: t.Nullable(t.Optional(t.String())),
	enabled: t.Boolean(),
	created: t.Date({ format: 'date-time' }),
	modified: t.Date({ format: 'date-time' }),
	permissions: t.Array(t.String()),
})
export type IUserRes = typeof UserResDto.static

export interface IUserMeta extends IUserRes {
	sessionId: string
	password: string
	totpSecret?: string | null
}

export const LoginResDto = t.Object({
	type: t.Literal(LOGIN_RES_TYPE.COMPLETED),
	accessToken: t.String(),
	refreshToken: t.String(),
	exp: t.Number(),
	expired: t.String(),
	user: UserResDto,
})
export type ILoginRes = typeof LoginResDto.static

export const LoginMFASetupResDto = t.Object({
	type: t.Literal(LOGIN_RES_TYPE.MFA_SETUP),
	mfaToken: t.String(),
	totpSecret: t.String(),
})
export type ILoginMFASetupRes = typeof LoginMFASetupResDto.static

export const LoginMFAResDto = t.Object({
	type: t.Literal(LOGIN_RES_TYPE.MFA_CONFIRM),
	mfaToken: t.String(),
	token: t.String(),
	availableMethods: t.Array(t.Enum(MFA_METHOD)),
})
export type ILoginMFARes = typeof LoginMFAResDto.static

export const LoginResponseDto = t.Union([
	LoginResDto,
	LoginMFASetupResDto,
	LoginMFAResDto,
])

export const LoginConfirmReqDto = t.Object({
	mfaToken: t.String(),
	otp: t.String(),
	token: t.String(),
})

export type ILoginConfirmReq = typeof LoginConfirmReqDto.static
