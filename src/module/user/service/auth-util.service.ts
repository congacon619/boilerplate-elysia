import dayjs from 'dayjs'
import { JWTPayload } from 'jose'
import {
	BadRequestException,
	aes256Decrypt,
	aes256Encrypt,
	isExpired,
	seconds,
	signJwt,
	verifyJwt,
} from '../../../common'
import { db, env, tokenCache } from '../../../config'
import { IAccessTokenRes, IAuthPassword, ITokenPayload } from '../type'

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
