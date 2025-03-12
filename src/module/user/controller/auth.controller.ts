import { Elysia } from 'elysia'
import { DOC_DETAIL, DOC_OPTIONS, ROUTER } from '../../../common'
import { ErrorResDto, ResDto } from '../../../common/type'
import { castToRes, env, reqMeta } from '../../../config'
import { authService } from '../service'
import {
	LoginConfirmReqDto,
	LoginDto,
	LoginResDto,
	LoginResponseDto,
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
		ROUTER.AUTH.LOGOUT,
		async ({ metadata }) => castToRes(await authService.logout(metadata, user)),
		{
			detail: DOC_DETAIL.LOGIN_CONFIRM,
			response: {
				200: ResDto(),
				401: ErrorResDto,
				403: ErrorResDto,
				500: ErrorResDto,
			},
		},
	)
