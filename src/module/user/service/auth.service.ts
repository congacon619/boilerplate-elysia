import jwt from '@elysiajs/jwt'
import {Elysia} from 'elysia'
import {env, tokenCache} from '../../../config'
import {aes256Encrypt, AppException, isExpired, seconds} from '../../../common'
import dayjs from 'dayjs'
import {IAccessTokenRes, ITokenPayload} from '../interface'

export const AuthService = new Elysia({ name: 'AuthService' })
	.use(
		jwt({
			name: 'jwtAccess',
			secret: env.JWT_ACCESS_TOKEN_SECRET_KEY,
			exp: env.JWT_ACCESS_TOKEN_EXPIRED,
			nbf: env.JWT_ACCESS_TOKEN_NOT_BEFORE_EXPIRATION,
			aud: env.JWT_AUDIENCE,
			iss: env.JWT_ISSUER,
			sub: env.JWT_SUBJECT,
		}),
	)
	.derive({ as: 'global' }, ({ jwtAccess }) => {
		const generateAndCacheToken = async (
			payload: ITokenPayload,
		): Promise<IAccessTokenRes> => {
			const data = await aes256Encrypt(payload)
			const accessToken = await jwtAccess.sign({ data })
			await tokenCache.set(payload.sessionId, accessToken)
			return {
				accessToken,
				expirationTime: dayjs()
					.add(seconds(env.JWT_ACCESS_TOKEN_EXPIRED), 's')
					.toDate(),
			}
		}
		return {
			AuthService: {
				async createAccessToken(
					payload: ITokenPayload,
				): Promise<IAccessTokenRes> {
					const cachedToken = await tokenCache.get(payload.sessionId)
					if (cachedToken) {
						const res = await jwtAccess.verify(cachedToken)
						if (
							!res ||
							!res.exp ||
							isExpired(res.exp * 1000, seconds(env.EXPIRED_TOLERANCE))
						) {
							return await generateAndCacheToken(payload)
						}
						return {
							accessToken: cachedToken,
							expirationTime: new Date(res.exp * 1000),
						}
					}
					return await generateAndCacheToken(payload)
				},

				async verifyAccessToken(
					token: string,
				): Promise<JwtPayload & { data: ITokenPayload }> {
					let decodedToken: JwtPayload & { data: ITokenPayload | string }
					try {
						decodedToken = jwt.verify(token, env.JWT_ACCESS_TOKEN_SECRET_KEY, {
							ignoreExpiration: true,
						}) as JwtPayload & { data: ITokenPayload | string }
					} catch {
						throw new AppException('exception.invalid-token')
					}

					if (
						isExpired(decodedToken.exp * 1000, seconds(env.EXPIRED_TOLERANCE))
					) {
						throw new AppException('exception.expired-token')
					}

					let data: ITokenPayload
					if (typeof decodedToken.data === 'string') {
						if (!this.memCache.enbTokenPayloadEncrypt) {
							throw new AppException('exception.expired-token')
						}
						data = aes256DecryptAndParse<ITokenPayload>(decodedToken.data)
					} else {
						data = decodedToken.data
					}

					const cachedToken = await tokenCache.get(data.sessionId)
					if (!cachedToken) {
						throw new AppException('exception.expired-token')
					}

					return { ...decodedToken, data }
				},
			},
		}
	})
