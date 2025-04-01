import bearer from '@elysiajs/bearer'
import { Elysia } from 'elysia'
import {
	IUserMeta,
	UPermission,
	UnauthorizedException,
	userResSelect,
} from '../common'
import { currentUserCache, db, logger } from '../config'
import { tokenService, userUtilService } from './auth-util.service'
import { ipWhitelistService } from './ip-whitelist.service'

export const authCheck = (
	app: Elysia<
		'',
		{
			derive: { clientIp: string; userAgent: string }
			decorator: Record<string, unknown>
			store: Record<string, unknown>
			resolve: Record<string, unknown>
		}
	>,
) =>
	app
		.guard({ as: 'scoped' })
		.use(bearer())
		.resolve({ as: 'local' }, async ({ clientIp, bearer }) => {
			await ipWhitelistService.preflight(clientIp)
			if (!bearer) {
				throw new UnauthorizedException('exception.invalid-token')
			}
			const { data } = await tokenService.verifyAccessToken(bearer)
			let currentUser: IUserMeta
			const cachedUser = await currentUserCache.get(data.sessionId)

			if (cachedUser) {
				currentUser = cachedUser
			} else {
				const user = await db.user.findUnique({
					where: { id: data.userId },
					select: {
						...userResSelect,
						password: true,
					},
				})

				if (!user || !user.enabled) {
					throw new UnauthorizedException('exception.expired-token')
				}

				currentUser = {
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
					permissions: await userUtilService.getPermissions(user),
				}

				await currentUserCache.set(data.sessionId, currentUser)
			}
			if (!currentUser) {
				throw new UnauthorizedException('exception.user-not-found')
			}
			return { currentUser }
		})

export const permissionCheck =
	(
		...requiredPermissions: UPermission[]
	): ((data: {
		clientIp: string
		currentUser: IUserMeta
		path: string
	}) => void) =>
	({ clientIp, currentUser, path }) => {
		const check =
			currentUser &&
			requiredPermissions.every(perm => currentUser.permissions.includes(perm))
		if (!check) {
			logger.error(
				currentUser
					? `User ${currentUser.username}@${clientIp} tried to access ${path} without sufficient permissions.`
					: `Anonymous user @${clientIp} tried to access ${path} without sufficient permissions.`,
			)
			throw new UnauthorizedException('exception.permission-denied')
		}
	}
