import { User } from '@prisma/client'
import dayjs from 'dayjs'
import { JWTPayload } from 'jose'
import { uniq } from 'lodash'
import {
	ACTIVITY_TYPE,
	BadRequestException,
	IReqMeta,
	PREFIX,
	aes256Decrypt,
	aes256Encrypt,
	isExpired,
	seconds,
	signJwt,
	token12,
	verifyJwt,
} from '../../../common'
import { db, env, tokenCache } from '../../../config'
import { activityService } from '../../activity/service'
import { sessionService } from '../../session/service'
import { settingService } from '../../setting/service'
import { LOGIN_RES_TYPE, LOGIN_WITH } from '../constant'
import {
	IAccessTokenRes,
	IAuthPassword,
	ILoginRes,
	ITokenPayload,
} from '../type'

export const passwordService = {
	async createPassword(password: string): Promise<IAuthPassword> {
		const passwordWithPepper = password + env.PASSWORD_PEPPER
		const passwordHash = await Bun.password.hash(passwordWithPepper)
		const passwordExpired = dayjs()
			.add(seconds(env.PASSWORD_EXPIRED), 's')
			.toDate()
		const passwordCreated = new Date()

		return {
			passwordHash,
			passwordExpired,
			passwordCreated,
		}
	},

	async increasePasswordAttempt(id: string): Promise<void> {
		await db.user.update({
			where: { id },
			data: { passwordAttempt: { increment: 1 } },
			select: { id: true },
		})
	},

	async comparePassword(
		password: string,
		passwordHash: string,
	): Promise<boolean> {
		const passwordWithPepper = password + env.PASSWORD_PEPPER
		return await Bun.password.verify(passwordWithPepper, passwordHash)
	},
}

export const tokenService = {
	async createRefreshToken(payload: ITokenPayload): Promise<{
		refreshToken: string
		expirationTime: Date
	}> {
		const expiredAt = dayjs()
			.add(seconds(env.JWT_REFRESH_TOKEN_EXPIRED), 's')
			.toDate()
		return {
			refreshToken: await aes256Encrypt({
				...payload,
				expired: expiredAt.getTime(),
			}),
			expirationTime: expiredAt,
		}
	},

	async generateAndCacheToken(
		payload: ITokenPayload,
	): Promise<IAccessTokenRes> {
		const data = await aes256Encrypt(payload)
		const accessToken = await signJwt({ data })
		await tokenCache.set(payload.sessionId, accessToken)
		return {
			accessToken,
			expirationTime: dayjs()
				.add(seconds(env.JWT_ACCESS_TOKEN_EXPIRED), 's')
				.toDate(),
		}
	},

	async createAccessToken(payload: ITokenPayload): Promise<IAccessTokenRes> {
		const cachedToken = await tokenCache.get(payload.sessionId)
		if (cachedToken) {
			const res = await verifyJwt(cachedToken)
			if (
				!res ||
				!res.exp ||
				isExpired(res.exp * 1000, seconds(env.EXPIRED_TOLERANCE))
			) {
				return await tokenService.generateAndCacheToken(payload)
			}
			return {
				accessToken: cachedToken,
				expirationTime: new Date(res.exp * 1000),
			}
		}
		return await tokenService.generateAndCacheToken(payload)
	},

	async verifyAccessToken(
		token: string,
	): Promise<JWTPayload & { data: ITokenPayload }> {
		const res = await verifyJwt(token)
		if (!res) {
			throw new BadRequestException('exception.invalid-token')
		}
		if (!res.exp || isExpired(res.exp * 1000, seconds(env.EXPIRED_TOLERANCE))) {
			throw new BadRequestException('exception.expired-token')
		}
		const data = await aes256Decrypt<ITokenPayload>(res.data)
		const cachedToken = await tokenCache.get(data.sessionId)
		if (!cachedToken) {
			throw new BadRequestException('exception.expired-token')
		}
		return { ...res, data }
	},
}

export const userUtilService = {
	async completeLogin(user: User, meta: IReqMeta): Promise<ILoginRes> {
		if (await settingService.enbOnlyOneSession()) {
			await sessionService.revoke(user.id)
		}
		const { ip, ua } = meta
		const sessionId = token12(PREFIX.SESSION)
		const payload: ITokenPayload = {
			userId: user.id,
			loginDate: new Date(),
			loginWith: LOGIN_WITH.LOCAL,
			sessionId,
			ip,
			ua: ua.ua,
		}

		const [
			{ accessToken, expirationTime },
			{ refreshToken, expirationTime: refreshTokenExpirationTime },
		] = await Promise.all([
			tokenService.createAccessToken(payload),
			tokenService.createRefreshToken(payload),
		])

		await db.$transaction(async tx => {
			const session = await tx.session.create({
				data: {
					id: sessionId,
					device:
						ua.browser.name && ua.os.name
							? `${ua.browser.name} ${ua.browser.version} on ${ua.os.name} ${ua.os.version}`
							: ua.ua,
					ip,
					createdById: user.id,
					expired: refreshTokenExpirationTime,
					userAgent: JSON.parse(JSON.stringify(ua)),
					token: refreshToken,
				},
				select: { id: true },
			})

			await activityService.create(
				{
					type: ACTIVITY_TYPE.LOGIN,
					meta,
					user: { id: user.id, sessionId: session.id },
				},
				tx,
			)
		})

		const roleUsers = await db.roleUser.findMany({
			where: { userId: user.id },
			select: { role: { select: { permissions: true } } },
		})

		const userRes = {
			id: user.id,
			mfaTelegramEnabled: user.mfaTelegramEnabled,
			mfaTotpEnabled: user.mfaTotpEnabled,
			telegramUsername: user.telegramUsername,
			enabled: user.enabled,
			created: user.created,
			username: user.username,
			modified: user.modified,
			permissions: uniq(roleUsers.flatMap(e => e.role.permissions)),
		}

		return {
			type: LOGIN_RES_TYPE.COMPLETED,
			accessToken,
			refreshToken,
			exp: expirationTime.getTime(),
			expired: dayjs(expirationTime).format(),
			user: userRes,
		}
	},
}
