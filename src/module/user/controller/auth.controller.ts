import { Elysia } from 'elysia'
import { DOC_OPTIONS, ROUTER } from '../../../common'
import { ErrorResDto, ResDto } from '../../../common/type'
import { castToRes, env, reqMeta } from '../../../config'
import { authService } from '../service'
import { LoginDto, LoginResponseDto } from '../type'

export const authController = new Elysia({
	name: 'AuthController',
	detail: { tags: [DOC_OPTIONS.tags.auth.name] },
	prefix: env.API_PREFIX,
})
	.use(reqMeta)
	.use(authService)
	.post(
		ROUTER.AUTH.LOGIN,
		async ({ Auth, body, metadata }) =>
			castToRes(await Auth.login(body, metadata)),
		{
			body: LoginDto,
			response: {
				200: ResDto(LoginResponseDto),
				400: ErrorResDto,
				404: ErrorResDto,
				500: ErrorResDto,
			},
		},
	)
