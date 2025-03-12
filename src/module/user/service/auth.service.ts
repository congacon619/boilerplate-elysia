import jwt, { JWTPayloadSpec } from '@elysiajs/jwt'
import { User } from '@prisma/client'
import dayjs from 'dayjs'
import { Elysia } from 'elysia'
import { compact, uniq } from 'lodash'
import { authenticator } from 'otplib'
import {
	ACTIVITY_TYPE,
	AppException,
	BadRequestException,
	NotFoundException,
	PREFIX,
	aes256Decrypt,
	aes256Encrypt,
	isExpired,
	seconds,
	token12,
	token16,
} from '../../../common'
import { IReqMeta } from '../../../common/type'
import {
	db,
	env,
	loginCache,
	mfaCache,
	mfaSetupCache,
	setting,
	tokenCache,
} from '../../../config'
import { activityService } from '../../activity/service'
import { sessionService } from '../../session/service'
import { LOGIN_RES_TYPE, LOGIN_WITH, MFA_METHOD } from '../constant'
import {
	IAccessTokenRes,
	ILogin,
	ILoginMFARes,
	ILoginMFASetupRes,
	ILoginRes,
	ITokenPayload,
} from '../type'

export const authService = new Elysia({ name: 'AuthService' })
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
	.derive({ as: 'scoped' }, ({ jwtAccess }) => {
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

		const increasePasswordAttempt = async (id: string): Promise<void> => {
			await db.user.update({
				where: { id },
				data: { passwordAttempt: { increment: 1 } },
				select: { id: true },
			})
		}

		const comparePassword = async (
			password: string,
			passwordHash: string,
		): Promise<boolean> => {
			const passwordWithPepper = password + env.PASSWORD_PEPPER
			return await Bun.password.verify(passwordHash, passwordWithPepper)
		}

		const createAccessToken = async (
			payload: ITokenPayload,
		): Promise<IAccessTokenRes> => {
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
		}

		const verifyAccessToken = async (
			token: string,
		): Promise<JWTPayloadSpec & { data: ITokenPayload }> => {
			const res = (await jwtAccess.verify(token)) as
				| (Record<string, string> & JWTPayloadSpec)
				| false
			if (!res) {
				throw new AppException('exception.invalid-token')
			}
			if (
				!res.exp ||
				isExpired(res.exp * 1000, seconds(env.EXPIRED_TOLERANCE))
			) {
				throw new AppException('exception.expired-token')
			}
			const data = await aes256Decrypt<ITokenPayload>(res.data)
			const cachedToken = await tokenCache.get(data.sessionId)
			if (!cachedToken) {
				throw new AppException('exception.expired-token')
			}
			return { ...res, data }
		}

		const createRefreshToken = async (
			payload: ITokenPayload,
		): Promise<{
			refreshToken: string
			expirationTime: Date
		}> => {
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
		}

		const createSession = async ({
			method,
			referenceToken,
			user,
		}: {
			method: MFA_METHOD
			referenceToken: string
			user: {
				mfaTotpEnabled: boolean
				totpSecret?: string | null
				id: string
				mfaTelegramEnabled: boolean
				telegramUsername?: string | null
			}
		}): Promise<string> => {
			try {
				const sessionId = token16()

				if (
					method === MFA_METHOD.TOTP &&
					user.mfaTotpEnabled &&
					user.totpSecret
				) {
					await mfaCache.set(sessionId, {
						userId: user.id,
						type: MFA_METHOD.TOTP,
						referenceToken,
					})
					return sessionId
				}

				if (
					method === MFA_METHOD.TELEGRAM &&
					user.mfaTelegramEnabled &&
					user.telegramUsername
				) {
					authenticator.options = { digits: 6, step: 300 } // 300 seconds
					const secret = authenticator.generateSecret()
					const otp = authenticator.generate(secret)
					await mfaCache.set(sessionId, {
						userId: user.id,
						type: MFA_METHOD.TELEGRAM,
						secret,
						referenceToken,
					})

					// todo: send message
					// await this.telegramService.jobSendMessage({
					// 	chatIds: [user.telegramUsername],
					// 	message: `Your OTP is: ${otp}`,
					// })
					return sessionId
				}
				throw new AppException('exception.mfa-broken')
			} catch {
				throw new AppException('exception.mfa-broken')
			}
		}

		const setupMfa = async (
			userId: string,
		): Promise<{ mfaToken: string; totpSecret: string }> => {
			const mfaToken = token16()
			const totpSecret = authenticator.generateSecret().toUpperCase()
			await mfaSetupCache.set(mfaToken, {
				method: MFA_METHOD.TOTP,
				totpSecret,
				userId,
			})
			return {
				mfaToken,
				totpSecret,
			}
		}

		const completeLogin = async (
			user: User,
			{ ip, ua }: IReqMeta,
		): Promise<ILoginRes> => {
			if (await setting.enbOnlyOneSession()) {
				await sessionService.revoke(user.id)
			}

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
				createAccessToken(payload),
				createRefreshToken(payload),
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
						clientInfo: { ip, ua: ua.ua },
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
				telegramUsername: user.telegramUsername || undefined,
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
		}

		return {
			Auth: {
				async login(
					{ username, password }: ILogin,
					meta: IReqMeta,
				): Promise<ILoginRes | ILoginMFASetupRes | ILoginMFARes> {
					const user = await db.user.findUnique({ where: { username } })
					if (!user) {
						throw new NotFoundException('exception.user-not-found')
					}

					const { enbAttempt, enbExpired } = await setting.password()
					if (enbAttempt && user.passwordAttempt >= env.PASSWORD_MAX_ATTEMPT) {
						throw new BadRequestException('exception.password-max-attempt')
					}

					if (!(await comparePassword(password, user.password))) {
						await increasePasswordAttempt(user.id)
						throw new BadRequestException('exception.password-not-match')
					}

					if (!user.enabled) {
						throw new BadRequestException('exception.user-not-active')
					}

					if (enbExpired && new Date() > new Date(user.passwordExpired)) {
						throw new BadRequestException('exception.password-expired')
					}

					if (user.mfaTelegramEnabled || user.mfaTotpEnabled) {
						const loginToken = token16()
						await loginCache.set(loginToken, { userId: user.id })
						const mfaToken = await createSession({
							method: MFA_METHOD.TOTP,
							user,
							referenceToken: loginToken,
						})
						return {
							type: LOGIN_RES_TYPE.MFA_CONFIRM,
							token: loginToken,
							mfaToken,
							availableMethods: compact([
								user.mfaTelegramEnabled ? MFA_METHOD.TELEGRAM : undefined,
								user.mfaTotpEnabled ? MFA_METHOD.TOTP : undefined,
							]),
						}
					}

					if (await setting.enbMFARequired()) {
						const { totpSecret, mfaToken } = await setupMfa(user.id)
						return {
							type: LOGIN_RES_TYPE.MFA_SETUP,
							totpSecret,
							mfaToken,
						}
					}

					return completeLogin(user, meta)
				},
			},
		}
	})
