import jwt, { JWTPayloadSpec } from '@elysiajs/jwt'
import { User } from '@prisma/client'
import dayjs from 'dayjs'
import { Elysia } from 'elysia'
import { compact, uniq } from 'lodash'
import {
	ACTIVITY_TYPE,
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
import { db, env, loginCache, tokenCache } from '../../../config'
import { activityService } from '../../activity/service'
import { sessionService } from '../../session/service'
import { settingService } from '../../setting/service'
import { LOGIN_RES_TYPE, LOGIN_WITH, MFA_METHOD } from '../constant'
import {
	IAccessTokenRes,
	ILogin,
	ILoginConfirmReq,
	ILoginMFARes,
	ILoginMFASetupRes,
	ILoginRes,
	ITokenPayload,
} from '../type'
import { passwordService, tokenService } from './auth-util.service'
import { mfaUtilService } from './mfa-util.service'

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
				throw new BadRequestException('exception.invalid-token')
			}
			if (
				!res.exp ||
				isExpired(res.exp * 1000, seconds(env.EXPIRED_TOLERANCE))
			) {
				throw new BadRequestException('exception.expired-token')
			}
			const data = await aes256Decrypt<ITokenPayload>(res.data)
			const cachedToken = await tokenCache.get(data.sessionId)
			if (!cachedToken) {
				throw new BadRequestException('exception.expired-token')
			}
			return { ...res, data }
		}

		const completeLogin = async (
			user: User,
			{ ip, ua }: IReqMeta,
		): Promise<ILoginRes> => {
			if (await settingService.enbOnlyOneSession()) {
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

					const { enbAttempt, enbExpired } = await settingService.password()
					if (enbAttempt && user.passwordAttempt >= env.PASSWORD_MAX_ATTEMPT) {
						throw new BadRequestException('exception.password-max-attempt')
					}

					const match = await passwordService.comparePassword(
						password,
						user.password,
					)
					if (!match) {
						await passwordService.increasePasswordAttempt(user.id)
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
						const mfaToken = await mfaUtilService.createSession({
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

					if (await settingService.enbMFARequired()) {
						const { totpSecret, mfaToken } = await mfaUtilService.setupMfa(
							user.id,
						)
						return {
							type: LOGIN_RES_TYPE.MFA_SETUP,
							totpSecret,
							mfaToken,
						}
					}

					return completeLogin(user, meta)
				},

				async loginConfirm(
					{ mfaToken, token, otp }: ILoginConfirmReq,
					meta: IReqMeta,
				): Promise<ILoginRes> {
					const login = await loginCache.get(token)
					if (!token || !login) {
						throw new BadRequestException('exception.session-expired')
					}

					const user = await db.user.findUnique({
						where: { id: login.userId },
					})
					if (!user || !user.enabled) {
						throw new BadRequestException('exception.user-not-active')
					}
					if (
						!(await mfaUtilService.verifySession({
							mfaToken,
							otp,
							user,
							referenceToken: token,
						}))
					) {
						throw new BadRequestException('exception.invalid-otp')
					}

					return completeLogin(user, meta)
				},
			},
		}
	})
