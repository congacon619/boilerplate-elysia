import { Elysia, t } from 'elysia'
import { authenticator } from 'otplib'
import {
	ACTIVITY_TYPE,
	BadReqErr,
	DOC_DETAIL,
	DOC_OPTIONS,
	ErrorResDto,
	MFA_METHOD,
	ROUTER,
	ResWrapper,
	authErrors,
	token16,
} from '../common'
import { castToRes, db, mfaSetupCache, reqMeta, resetMfaCache } from '../config'
import {
	activityService,
	authCheck,
	mfaUtilService,
	passwordService,
	permissionCheck,
	sessionService,
} from '../service'
import {
	MfaConfirmDto,
	MfaResetConfirmDto,
	MfaResetDto,
	MfaResetResDto,
	MfaSetupDto,
	MfaSetupResDto,
} from './dto'

export const mfaController = new Elysia({
	name: 'MfaController',
	detail: { tags: [DOC_OPTIONS.tags.mfa.name] },
	prefix: ROUTER.MFA.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
	.post(
		ROUTER.MFA.CONFIRM,
		async ({ body: { mfaToken, otp }, clientIp, userAgent, currentUser }) => {
			const cachedData = await mfaSetupCache.get(mfaToken)
			if (!cachedData) {
				throw new BadReqErr('exception.session-expired')
			}

			if (cachedData.method === MFA_METHOD.TELEGRAM) {
				if (
					!authenticator.verify({ secret: cachedData.totpSecret, token: otp })
				) {
					throw new BadReqErr('exception.invalid-otp')
				}

				await db.user.update({
					where: { id: cachedData.userId },
					data: {
						telegramUsername: cachedData.telegramUsername,
						mfaTelegramEnabled: true,
					},
					select: { id: true },
				})
			} else {
				if (
					!authenticator.verify({ secret: cachedData.totpSecret, token: otp })
				) {
					throw new BadReqErr('exception.invalid-otp')
				}

				await db.user.update({
					where: { id: cachedData.userId },
					data: {
						totpSecret: cachedData.totpSecret,
						mfaTotpEnabled: true,
					},
					select: { id: true },
				})
			}

			if (cachedData.sessionId) {
				await sessionService.revoke(cachedData.userId, [cachedData.sessionId])
				await activityService.create(
					ACTIVITY_TYPE.SETUP_MFA,
					{
						method: cachedData.method,
						telegramUsername:
							cachedData.method === MFA_METHOD.TELEGRAM
								? cachedData.telegramUsername
								: undefined,
					},
					{ clientIp, userAgent, currentUser },
				)
			}
			return castToRes(null)
		},
		{
			body: MfaConfirmDto,
			detail: DOC_DETAIL.MFA_SETUP_CONFIRM,
			response: {
				200: ResWrapper(t.Null()),
				400: ErrorResDto,
				500: ErrorResDto,
			},
		},
	)
	.post(
		ROUTER.MFA.REQUEST,
		async ({ body: { password, method, telegramUsername }, currentUser }) => {
			if (
				!(await passwordService.comparePassword(password, currentUser.password))
			) {
				throw new BadReqErr('exception.password-not-match')
			}
			const mfaToken = token16()
			const totpSecret = authenticator.generateSecret().toUpperCase()

			if (method === MFA_METHOD.TELEGRAM && !currentUser.mfaTelegramEnabled) {
				if (!telegramUsername) {
					throw new BadReqErr('exception.validation-error')
				}

				authenticator.options = { digits: 6, step: 300 }
				const secret = authenticator.generateSecret()
				const otp = authenticator.generate(secret)

				await mfaSetupCache.set(mfaToken, {
					method,
					userId: currentUser.id,
					sessionId: currentUser.sessionId,
					telegramUsername,
					otp,
					totpSecret,
				})

				return castToRes({
					mfaToken,
				})
			}

			if (method === MFA_METHOD.TOTP && !currentUser.mfaTotpEnabled) {
				const totpSecret = authenticator.generateSecret().toUpperCase()
				await mfaSetupCache.set(mfaToken, {
					method,
					totpSecret,
					userId: currentUser.id,
					sessionId: currentUser.sessionId,
				})

				return castToRes({
					mfaToken,
					totpSecret,
				})
			}

			throw new BadReqErr('exception.mfa-method-unavailable')
		},
		{
			body: MfaSetupDto,
			detail: {
				...DOC_DETAIL.MFA_SETUP_REQUEST,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(MfaSetupResDto),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.MFA.RESET_REQUEST,
		async ({ body: { userIds, method }, currentUser }) => {
			const token = token16()
			const mfaToken = await mfaUtilService.createSession({
				method,
				user: currentUser,
				referenceToken: token,
			})

			await resetMfaCache.set(token, {
				userIds,
			})

			return castToRes({
				mfaToken,
				token,
			})
		},
		{
			beforeHandle: permissionCheck('USER.RESET_MFA'),
			body: MfaResetDto,
			detail: {
				...DOC_DETAIL.MFA_RESET_REQUEST,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(MfaResetResDto),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.MFA.RESET_CONFIRM,
		async ({
			body: { token, mfaToken, otp },
			currentUser,
			clientIp,
			userAgent,
		}) => {
			const cacheData = await resetMfaCache.get(token)
			if (!cacheData) {
				throw new BadReqErr('exception.session-expired')
			}

			const isVerified = await mfaUtilService.verifySession({
				mfaToken,
				otp,
				referenceToken: token,
				user: currentUser,
			})
			if (!isVerified) {
				throw new BadReqErr('exception.invalid-otp')
			}

			await db.$transaction([
				db.user.updateMany({
					where: { id: { in: cacheData.userIds } },
					data: {
						mfaTelegramEnabled: false,
						mfaTotpEnabled: false,
						totpSecret: null,
						telegramUsername: null,
					},
				}),
				activityService.create(
					ACTIVITY_TYPE.RESET_MFA,
					{ userIds: cacheData.userIds },
					{ userAgent, clientIp, currentUser },
				),
			])

			await Promise.all(
				cacheData.userIds.map(userId => sessionService.revoke(userId)),
			)
			return castToRes(null)
		},
		{
			beforeHandle: permissionCheck('USER.RESET_MFA'),
			body: MfaResetConfirmDto,
			detail: {
				...DOC_DETAIL.MFA_RESET_CONFIRM,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Null()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
