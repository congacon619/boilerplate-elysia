import { authenticator, totp } from 'otplib'
import { AppException, token16 } from '../../../common'
import { mfaCache, mfaSetupCache } from '../../../config'
import { MFA_METHOD } from '../constant'

interface IUserMFA {
	mfaTotpEnabled: boolean
	totpSecret?: string | null
	id: string
	mfaTelegramEnabled: boolean
	telegramUsername?: string | null
}

export const mfaUtilService = {
	async createSession({
		method,
		referenceToken,
		user,
	}: {
		method: MFA_METHOD
		referenceToken: string
		user: IUserMFA
	}): Promise<string> {
		const sessionId = token16()

		if (method === MFA_METHOD.TOTP && user.mfaTotpEnabled && user.totpSecret) {
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
			// await telegramService.jobSendMessage({
			// 	chatIds: [user.telegramUsername],
			// 	message: `Your OTP is: ${otp}`,
			// })
			return sessionId
		}
		throw new AppException('exception.mfa-broken')
	},

	async setupMfa(
		userId: string,
	): Promise<{ mfaToken: string; totpSecret: string }> {
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
	},

	async verifySession({
		mfaToken,
		otp,
		referenceToken,
		user,
	}: {
		mfaToken: string
		otp: string
		referenceToken: string
		user: IUserMFA
	}): Promise<boolean> {
		const cacheData = await mfaCache.get(mfaToken)

		if (
			!cacheData ||
			cacheData.userId !== user.id ||
			cacheData.referenceToken !== referenceToken
		) {
			return false
		}

		if (cacheData.type === MFA_METHOD.TOTP) {
			if (!user.mfaTotpEnabled || !user.totpSecret) {
				return false
			}

			if (authenticator.verify({ secret: user.totpSecret, token: otp })) {
				return true
			}
		}

		if (cacheData.type === MFA_METHOD.TELEGRAM) {
			if (!user.mfaTelegramEnabled || !user.telegramUsername) {
				return false
			}

			const telegramTotp = totp.create({
				...totp.options,
				step: 300,
				window: 0,
			})

			if (telegramTotp.verify({ secret: cacheData.secret, token: otp })) {
				return true
			}
		}

		return false
	},
}
