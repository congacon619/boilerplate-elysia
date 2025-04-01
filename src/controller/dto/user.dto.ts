import { t } from 'elysia'
import { LOGIN_RES_TYPE, MFA_METHOD } from '../../common'

export const LoginDto = t.Object({
	username: t.String({ minLength: 1 }),
	password: t.String({ minLength: 1 }),
})

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

export const LoginMFAResDto = t.Object({
	type: t.Literal(LOGIN_RES_TYPE.MFA_CONFIRM),
	mfaToken: t.String(),
	token: t.String(),
	availableMethods: t.Array(t.Enum(MFA_METHOD)),
})

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

export const RefreshTokenDto = t.Object({ token: t.String({ minLength: 1 }) })

export const ChangePasswordDto = t.Object({
	oldPassword: t.String(),
	method: t.Optional(t.Enum(MFA_METHOD)),
})
export const ChangePasswordResDto = t.Object({
	token: t.String(),
	mfaToken: t.Optional(t.String()),
})

export const ChangePasswordConfirm = t.Object({
	newPassword: t.String(),
	token: t.String(),
	mfaToken: t.Optional(t.String()),
	otp: t.Optional(t.String()),
})

export const PaginateUserResDto = t.Array(
	t.Intersect([
		t.Omit(UserResDto, ['permissions']),
		t.Object({
			roles: t.Array(
				t.Object({
					id: t.String(),
					title: t.String(),
					description: t.Nullable(t.String()),
					enabled: t.Boolean(),
					created: t.Date({ format: 'date-time' }),
					modified: t.Date({ format: 'date-time' }),
				}),
			),
			sessions: t.Array(
				t.Object({
					created: t.Date({ format: 'date-time' }),
				}),
			),
		}),
	]),
)

export const UserUpsertDto = t.Object({
	id: t.Optional(t.String()),
	username: t.String(),
	password: t.Optional(t.String()),
	enabled: t.Boolean(),
	roleIds: t.Array(t.String()),
})

export const MfaSetupDto = t.Object({
	password: t.String({
		description: 'The password of the user',
		examples: ['yourSecurePassword123'],
	}),
	method: t.Enum(MFA_METHOD, {
		description: 'The MFA method to be set up',
		examples: [MFA_METHOD.TELEGRAM],
	}),
	telegramUsername: t.Optional(
		t.String({
			description: 'The Telegram username (required if method is Telegram)',
			examples: ['your_telegram_username'],
		}),
	),
})

export const MfaSetupResDto = t.Object({
	mfaToken: t.String(),
	totpSecret: t.Optional(t.String()),
})

export const MfaConfirmDto = t.Object({
	mfaToken: t.String(),
	otp: t.String(),
})

export const MfaResetDto = t.Object({
	method: t.Enum(MFA_METHOD),
	userIds: t.Array(t.String()),
})

export const MfaResetResDto = t.Object({
	mfaToken: t.String(),
	token: t.String(),
})

export const MfaResetConfirmDto = t.Object({
	mfaToken: t.String(),
	otp: t.String(),
	token: t.String(),
})
