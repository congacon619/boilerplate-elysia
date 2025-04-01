import { authenticator } from 'otplib'
import {
	ACTIVITY_TYPE,
	BadRequestException,
	IReqMeta,
	token16,
} from '../../../common'
import { db, mfaSetupCache, resetMfaCache } from '../../../config'
import { activityService } from '../../activity/service'
import { sessionService } from '../../session/service'
import { MFA_METHOD } from '../constant'
import {
	IMfaConfirm,
	IMfaReset,
	IMfaResetConfirm,
	IMfaResetRes,
	IMfaSetup,
	IMfaSetupRes,
	IUserMeta,
} from '../type'
import { passwordService } from './auth-util.service'
import { mfaUtilService } from './mfa-util.service'

export const mfaService = {
	async setupMFARequest(
		{ password, method, telegramUsername }: IMfaSetup,
		user: IUserMeta,
	): Promise<IMfaSetupRes> {
		if (!(await passwordService.comparePassword(password, user.password))) {
			throw new BadRequestException('exception.password-not-match')
		}

		const mfaToken = token16()
		const totpSecret = authenticator.generateSecret().toUpperCase()

		if (method === MFA_METHOD.TELEGRAM && !user.mfaTelegramEnabled) {
			if (!telegramUsername) {
				throw new BadRequestException('exception.validation-error')
			}

			authenticator.options = { digits: 6, step: 300 }
			const secret = authenticator.generateSecret()
			const otp = authenticator.generate(secret)

			await mfaSetupCache.set(mfaToken, {
				method,
				userId: user.id,
				sessionId: user.sessionId,
				telegramUsername,
				otp,
				totpSecret,
			})

			return {
				mfaToken,
			}
		}

		if (method === MFA_METHOD.TOTP && !user.mfaTotpEnabled) {
			const totpSecret = authenticator.generateSecret().toUpperCase()
			await mfaSetupCache.set(mfaToken, {
				method,
				totpSecret,
				userId: user.id,
				sessionId: user.sessionId,
			})

			return {
				mfaToken,
				totpSecret,
			}
		}

		throw new BadRequestException('exception.mfa-method-unavailable')
	},

	async setupMFAConfirm(
		{ mfaToken, otp }: IMfaConfirm,
		meta: IReqMeta,
	): Promise<void> {
		const cachedData = await mfaSetupCache.get(mfaToken)
		if (!cachedData) {
			throw new BadRequestException('exception.session-expired')
		}

		if (cachedData.method === MFA_METHOD.TELEGRAM) {
			if (
				!authenticator.verify({ secret: cachedData.totpSecret, token: otp })
			) {
				throw new BadRequestException('exception.invalid-otp')
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
				throw new BadRequestException('exception.invalid-otp')
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
			await activityService.create({
				type: ACTIVITY_TYPE.SETUP_MFA,
				user: {
					sessionId: cachedData.sessionId,
					id: cachedData.userId,
				},
				meta,
				reference: {
					method: cachedData.method,
					telegramUsername:
						cachedData.method === MFA_METHOD.TELEGRAM
							? cachedData.telegramUsername
							: undefined,
				},
			})
		}
	},

	async createResetMFARequest(
		{ method, userIds }: IMfaReset,
		user: IUserMeta,
	): Promise<IMfaResetRes> {
		const token = token16()
		const mfaToken = await mfaUtilService.createSession({
			method,
			user,
			referenceToken: token,
		})

		await resetMfaCache.set(token, {
			userIds,
		})

		return {
			mfaToken,
			token,
		}
	},

	async confirmResetMFA(
		{ mfaToken, otp, token }: IMfaResetConfirm,
		user: IUserMeta,
		meta: IReqMeta,
	): Promise<void> {
		const cacheData = await resetMfaCache.get(token)
		if (!cacheData) {
			throw new BadRequestException('exception.session-expired')
		}

		const isVerified = await mfaUtilService.verifySession({
			mfaToken,
			otp,
			referenceToken: token,
			user,
		})
		if (!isVerified) {
			throw new BadRequestException('exception.invalid-otp')
		}

		await db.$transaction([
			db.user.updateMany({
				where: {
					id: {
						in: cacheData.userIds,
					},
				},
				data: {
					mfaTelegramEnabled: false,
					mfaTotpEnabled: false,
					totpSecret: null,
					telegramUsername: null,
				},
			}),
			activityService.create({
				type: ACTIVITY_TYPE.RESET_MFA,
				user,
				meta,
			}),
		])

		await Promise.all(
			cacheData.userIds.map(userId => sessionService.revoke(userId)),
		)
	},
}
