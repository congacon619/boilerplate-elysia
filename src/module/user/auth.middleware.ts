import { Elysia } from 'elysia'
import { UnauthorizedException } from '../../common'
import { IReqMeta } from '../../common/type'
import { currentUserCache, db, logger } from '../../config'
import { ipWhitelistService } from '../ip-whitelist/service'
import { tokenService } from './service'
import { IUserMeta, PermissionType } from './type'

export const authCheck = (
	app: Elysia<
		'',
		{
			derive: { metadata: IReqMeta }
			decorator: Record<string, unknown>
			store: Record<string, unknown>
			resolve: Record<string, unknown>
		}
	>,
) =>
	app
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

const validPermission = (
	userPermissions: string[],
	requiredPermissions: PermissionType,
): boolean => {
	if (!requiredPermissions) {
		return true
	}
	if (!userPermissions?.length) {
		return false
	}
	if (typeof requiredPermissions === 'string') {
		return userPermissions.includes(requiredPermissions)
	}

	if ('and' in requiredPermissions) {
		return requiredPermissions.and.every(permission =>
			validPermission(userPermissions, permission),
		)
	}

	if ('or' in requiredPermissions) {
		return requiredPermissions.or.some(permission =>
			validPermission(userPermissions, permission),
		)
	}

	if ('not' in requiredPermissions) {
		return !validPermission(userPermissions, requiredPermissions.not)
	}

	return false
}

export const permissionCheck =
	(
		permission: PermissionType,
	): ((data: { metadata: IReqMeta; user: IUserMeta; path: string }) => void) =>
	({ metadata, user, path }) => {
		console.log(permission)
		const check = validPermission(user.permissions, permission)
		if (!check) {
			logger.info(
				`User ${user?.username}@${metadata.ip} trying to access resource ${path} but doesn't have enough permissions`,
			)
			throw new UnauthorizedException('exception.permission-denied')
		}
	}
