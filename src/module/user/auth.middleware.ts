import type { Elysia } from 'elysia'
import { UnauthorizedException } from '../../common'

export const isAuthenticated = (app: Elysia) =>
	app.derive(async ({ request: { headers } }) => {
		const authorization: string | null = headers.get('Authorization')
		if (!authorization) {
			throw new UnauthorizedException('exception.invalid-token')
		}
		const token: string = authorization.split(' ')[1]
		if (!token) {
			throw new UnauthorizedException('exception.invalid-token')
		}
		let payload: IJwtPayload
		try {
			payload = verifyAccessToken(token)
		} catch (e: any) {
			if (e?.name === 'TokenExpiredError') {
				throw HttpError.Unauthorized(...Object.values(RES_KEY.TOKEN_EXPIRED))
			}
			throw HttpError.Unauthorized(...Object.values(RES_KEY.WRONG_TOKEN))
		}
		if (!payload?.sessionId) {
			throw HttpError.Unauthorized(...Object.values(RES_KEY.WRONG_TOKEN))
		}
		const session: ISession = (await sessionRepository.fetch(
			payload.sessionId,
		)) as ISession
		if (!session.userId) {
			throw HttpError.Unauthorized(...Object.values(RES_KEY.TOKEN_EXPIRED))
		}
		const user: UserWithRoles | undefined = await userService.getUserDetail(
			session.userId,
		)
		if (!user) {
			throw HttpError.NotFound(...Object.values(RES_KEY.USER_NOT_FOUND))
		}
		userService.checkUserStatus(user.status)
		return {
			user,
			sessionId: payload.sessionId,
			refreshSessionId: payload.refreshSessionId,
		}
	})

export const hasPermissions = (
	policyRule: IPolicyRule[],
): (({ user }: { user: UserWithRoles }) => void) => {
	return ({ user }) => {
		let check = false
		for (const role of user.roles) {
			const ability: IPolicyAbility = policyService.defineAbilityFromRole({
				name: role.name as ROLE_NAME,
				permissions: role.permissions as IPolicyRule[],
			})
			const policyHandler: PolicyHandler[] =
				policyService.handlerRules(policyRule)
			if (
				policyHandler.every((handler: PolicyHandler) => {
					return policyService.execPolicyHandler(handler, ability)
				})
			) {
				check = true
			}
		}
		if (!check) {
			throw HttpError.Forbidden(...Object.values(RES_KEY.ABILITY_FORBIDDEN))
		}
	}
}
