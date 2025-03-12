import { Elysia } from 'elysia'
import { UnauthorizedException } from '../../common'
import { currentUserCache, db, reqMeta } from '../../config'
import { ipWhitelistService } from '../ip-whitelist/service'
import { tokenService } from './service'
import { IUserMeta } from './type'

export const authCheck = (app: Elysia) =>
	app
		.use(reqMeta)
		.guard({ as: 'scoped' })
		.resolve({ as: 'local' }, async ({ request: { headers }, metadata }) => {
			await ipWhitelistService.preflight(metadata.ip)
			const authorization: string | null = headers.get('Authorization')
			if (!authorization) {
				throw new UnauthorizedException('exception.invalid-token')
			}
			const token: string = authorization.split(' ')[1]
			if (!token) {
				throw new UnauthorizedException('exception.invalid-token')
			}
			const { data } = await tokenService.verifyAccessToken(token)
			let userPayload: IUserMeta
			const cachedUser = await currentUserCache.get(data.sessionId)

			if (cachedUser) {
				userPayload = cachedUser
			} else {
				const user = await db.user.findUnique({
					where: { id: data.userId },
					select: {
						id: true,
						username: true,
						mfaTelegramEnabled: true,
						mfaTotpEnabled: true,
						totpSecret: true,
						telegramUsername: true,
						password: true,
						enabled: true,
						created: true,
						modified: true,
					},
				})

				if (!user || !user.enabled) {
					throw new UnauthorizedException('exception.expired-token')
				}

				const roleUsers = await db.roleUser.findMany({
					where: { userId: user.id },
					select: { role: { select: { permissions: true } } },
				})

				userPayload = {
					id: user.id,
					username: user.username,
					sessionId: data.sessionId,
					mfaTelegramEnabled: user.mfaTelegramEnabled,
					mfaTotpEnabled: user.mfaTotpEnabled,
					totpSecret: user.totpSecret,
					telegramUsername: user.telegramUsername,
					password: user.password,
					enabled: user.enabled,
					created: user.created,
					modified: user.modified,
					permissions: [...new Set(roleUsers.flatMap(p => p.role.permissions))],
				}

				await currentUserCache.set(data.sessionId, userPayload)
			}
			if (!userPayload) {
				throw new UnauthorizedException('exception.user-not-found')
			}
			return { user: userPayload }
		})

// export const permissionCheck = (
// 	policyRule: IPolicyRule[],
// ): (({ user }: { user: UserWithRoles }) => void) => {
// 	return ({ user }) => {
// 		let check = false
// 		for (const role of user.roles) {
// 			const ability: IPolicyAbility = policyService.defineAbilityFromRole({
// 				name: role.name as ROLE_NAME,
// 				permissions: role.permissions as IPolicyRule[],
// 			})
// 			const policyHandler: PolicyHandler[] =
// 				policyService.handlerRules(policyRule)
// 			if (
// 				policyHandler.every((handler: PolicyHandler) => {
// 					return policyService.execPolicyHandler(handler, ability)
// 				})
// 			) {
// 				check = true
// 			}
// 		}
// 		if (!check) {
// 			throw HttpError.Forbidden(...Object.values(RES_KEY.ABILITY_FORBIDDEN))
// 		}
// 	}
// }
