import { Elysia, t } from 'elysia'
import { DOC_DETAIL, DOC_OPTIONS, ROUTER } from '../../../common'
import { ErrorResDto, authErrors } from '../../../common/type'
import { env, reqMeta } from '../../../config'
import { authCheck } from '../auth.middleware'
import { authService } from '../service'
import {
	ChangePasswordConfirm,
	ChangePasswordDto,
	ChangePasswordResDto,
	LoginConfirmReqDto,
	LoginDto,
	LoginMFASetupResDto,
	LoginResDto,
	LoginResponseDto,
	RefreshTokenDto,
	UserResDto,
} from '../type'

export const authController = new Elysia({
	name: 'AuthController',
	detail: { tags: [DOC_OPTIONS.tags.auth.name] },
	prefix: env.API_PREFIX,
})
	.use(reqMeta)
	.post(
		ROUTER.AUTH.LOGIN,
		({ body, metadata }) => authService.login(body, metadata),
		{
			body: LoginDto,
			detail: DOC_DETAIL.LOGIN,
			response: {
				200: LoginResponseDto,
				400: ErrorResDto,
				404: ErrorResDto,
				500: ErrorResDto,
			},
		},
	)
	.post(
		ROUTER.AUTH.LOGIN_CONFIRM,
		({ body, metadata }) => authService.loginConfirm(body, metadata),
		{
			body: LoginConfirmReqDto,
			detail: DOC_DETAIL.LOGIN_CONFIRM,
			response: {
				200: LoginResDto,
				400: ErrorResDto,
				404: ErrorResDto,
				500: ErrorResDto,
			},
		},
	)
	.post(
		ROUTER.AUTH.REGISTER,
		({ body, metadata }) => authService.register(body, metadata),
		{
			body: LoginDto,
			detail: DOC_DETAIL.REGISTER,
			response: {
				200: t.Void(),
				400: ErrorResDto,
				404: ErrorResDto,
				500: ErrorResDto,
			},
		},
	)
	.use(authCheck)
	.post(
		ROUTER.AUTH.LOGOUT,
		({ metadata, user }) => authService.logout(metadata, user),
		{
			detail: {
				...DOC_DETAIL.LOGOUT,
				security: [{ accessToken: [] }],
			},
			response: {
				200: t.Void(),
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.AUTH.REFRESH_TOKEN,
		({ metadata, body }) => authService.refreshToken(body, metadata),
		{
			body: RefreshTokenDto,
			detail: {
				...DOC_DETAIL.REFRESH_TOKEN,
				security: [{ accessToken: [] }],
			},
			response: {
				200: t.Union([LoginResDto, LoginMFASetupResDto]),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.get(
		ROUTER.AUTH.CURRENT_USER,
		({ user }) => ({
			id: user.id,
			mfaTelegramEnabled: user.mfaTelegramEnabled,
			mfaTotpEnabled: user.mfaTotpEnabled,
			telegramUsername: user.telegramUsername,
			enabled: user.enabled,
			created: user.created,
			username: user.username,
			modified: user.modified,
			permissions: user.permissions,
		}),
		{
			detail: {
				...DOC_DETAIL.CURRENT_USER,
				security: [{ accessToken: [] }],
			},
			response: {
				200: UserResDto,
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.AUTH.CHANGE_PASSWORD,
		({ body, user }) => authService.changePassword(body, user),
		{
			body: ChangePasswordDto,
			detail: {
				...DOC_DETAIL.CHANGE_PASSWORD,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ChangePasswordResDto,
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.AUTH.CHANGE_PASSWORD_CONFIRM,
		({ metadata, body, user }) =>
			authService.changePasswordConfirm(body, user, metadata),
		{
			body: ChangePasswordConfirm,
			detail: {
				...DOC_DETAIL.CHANGE_PASSWORD_CONFIRM,
				security: [{ accessToken: [] }],
			},
			response: {
				200: t.Void(),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
