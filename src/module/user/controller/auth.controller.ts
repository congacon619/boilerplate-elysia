import { Elysia } from 'elysia'
import { DOC_OPTIONS, ROUTER } from '../../../common'
import { reqMeta } from '../../../config'
import { authService } from '../service'
import { LoginDto } from '../type'

export const authController = new Elysia({
	name: 'AuthController',
	detail: { tags: [DOC_OPTIONS.tags.auth.name] },
})
	.use(reqMeta)
	.use(authService)
	.post(
		ROUTER.AUTH.LOGIN,
		({ Auth, body, metadata }) => Auth.login(body, metadata),
		{ body: LoginDto },
	)
