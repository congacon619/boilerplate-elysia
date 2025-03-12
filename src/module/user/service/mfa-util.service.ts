import { authenticator } from 'otplib'
import { AppException, token16 } from '../../../common'
import { mfaCache, mfaSetupCache } from '../../../config'
import { MFA_METHOD } from '../constant'

export const mfaUtilService = {
	async createSession({
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
	}): Promise<string> {
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
}
