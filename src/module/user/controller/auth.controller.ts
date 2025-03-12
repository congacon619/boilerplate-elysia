import { Elysia, t } from 'elysia'
import { DOC_DETAIL, DOC_OPTIONS, ROUTER } from '../../../common'
import { ErrorResDto, ResDto } from '../../../common/type'
import { castToRes, env, reqMeta } from '../../../config'
import { authCheck } from '../auth.middleware'
import { authService } from '../service'
import {
	LoginConfirmReqDto,
	LoginDto,
	LoginMFASetupResDto,
	LoginResDto,
	LoginResponseDto,
	RefreshTokenDto,
} from '../type'

export const authController = new Elysia({
	name: 'AuthController',
	detail: { tags: [DOC_OPTIONS.tags.auth.name] },
	prefix: env.API_PREFIX,
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
				200: ResDto(LoginResponseDto),
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
				200: ResDto(LoginResDto),
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
				200: ResDto(),
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
				200: ResDto(),
				401: ErrorResDto,
				403: ErrorResDto,
				500: ErrorResDto,
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
				200: ResDto(t.Union([LoginResDto, LoginMFASetupResDto])),
				400: ErrorResDto,
				401: ErrorResDto,
				403: ErrorResDto,
				500: ErrorResDto,
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
				telegramUsername: user.telegramUsername || undefined,
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
				200: ResDto(),
				401: ErrorResDto,
				403: ErrorResDto,
				500: ErrorResDto,
			},
		},
	)
