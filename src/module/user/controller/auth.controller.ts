import { Elysia, t } from 'elysia'
import { DOC_DETAIL, DOC_OPTIONS, ROUTER } from '../../../common'
import { ErrorResDto, ResWrapper, authErrors } from '../../../common/type'
import { castToRes, reqMeta } from '../../../config'
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
})
	.use(reqMeta)
	.post(
		ROUTER.AUTH.LOGIN,
		async ({ body, metadata }) =>
			castToRes(await authService.login(body, metadata)),
		{
			body: LoginDto,
			detail: DOC_DETAIL.LOGIN,
			response: {
				200: ResWrapper(LoginResponseDto),
				400: ErrorResDto,
				404: ErrorResDto,
				500: ErrorResDto,
			},
		},
	)
	.post(
		ROUTER.AUTH.LOGIN_CONFIRM,
		async ({ body, metadata }) =>
			castToRes(await authService.loginConfirm(body, metadata)),
		{
			body: LoginConfirmReqDto,
			detail: DOC_DETAIL.LOGIN_CONFIRM,
			response: {
				200: ResWrapper(LoginResDto),
				400: ErrorResDto,
				404: ErrorResDto,
				500: ErrorResDto,
			},
		},
	)
	.post(
		ROUTER.AUTH.REGISTER,
		async ({ body, metadata }) =>
			castToRes(await authService.register(body, metadata)),
		{
			body: LoginDto,
			detail: DOC_DETAIL.REGISTER,
			response: {
				200: ResWrapper(t.Void()),
				400: ErrorResDto,
				404: ErrorResDto,
				500: ErrorResDto,
			},
		},
	)
	.use(authCheck)
	.post(
		ROUTER.AUTH.LOGOUT,
		async ({ metadata, user }) =>
			castToRes(await authService.logout(metadata, user)),
		{
			detail: {
				...DOC_DETAIL.LOGOUT,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Void()),
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.AUTH.REFRESH_TOKEN,
		async ({ metadata, body }) =>
			castToRes(await authService.refreshToken(body, metadata)),
		{
			body: RefreshTokenDto,
			detail: {
				...DOC_DETAIL.REFRESH_TOKEN,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Union([LoginResDto, LoginMFASetupResDto])),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.get(
		ROUTER.AUTH.CURRENT_USER,
		({ user }) =>
			castToRes({
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
				200: ResWrapper(UserResDto),
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.AUTH.CHANGE_PASSWORD,
		async ({ body, user }) =>
			castToRes(await authService.changePassword(body, user)),
		{
			body: ChangePasswordDto,
			detail: {
				...DOC_DETAIL.CHANGE_PASSWORD,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(ChangePasswordResDto),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.AUTH.CHANGE_PASSWORD_CONFIRM,
		async ({ metadata, body, user }) =>
			castToRes(await authService.changePasswordConfirm(body, user, metadata)),
		{
			body: ChangePasswordConfirm,
			detail: {
				...DOC_DETAIL.CHANGE_PASSWORD_CONFIRM,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Void()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
