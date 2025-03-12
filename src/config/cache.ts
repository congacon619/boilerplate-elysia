import KeyvRedis from '@keyv/redis'
import Keyv from 'keyv'
import { isNil } from 'lodash'
import { CACHE_NS, SETTING, milliseconds } from '../common'
import { MFA_METHOD } from '../module/user/constant'
import { env } from './env'

const redis = new KeyvRedis({
	url: env.REDIS_URI,
	password: env.REDIS_PASSWORD,
})

export const tokenCache = new Keyv<string>(redis, {
	namespace: CACHE_NS.ACCESS_TOKEN,
	ttl: milliseconds(env.JWT_ACCESS_TOKEN_EXPIRED),
})

export const loginCache = new Keyv<{ userId: string }>(redis, {
	namespace: CACHE_NS.LOGIN,
	ttl: milliseconds('5m'),
})

export const mfaSetupCache = new Keyv<
	| {
			method: MFA_METHOD.TELEGRAM
			totpSecret: string
			userId: string
			sessionId?: string
			telegramUsername: string
			otp: string
	  }
	| {
			method: MFA_METHOD.TOTP
			totpSecret: string
			userId: string
			sessionId?: string
	  }
>(redis, {
	namespace: CACHE_NS.MFA_SETUP,
	ttl: milliseconds('15m'),
})

export const mfaCache = new Keyv<
	| {
			userId: string
			referenceToken: string
			type: MFA_METHOD.TOTP
	  }
	| {
			userId: string
			referenceToken: string
			type: MFA_METHOD.TELEGRAM
			secret: string
	  }
>(redis, {
	namespace: CACHE_NS.MFA,
	ttl: milliseconds('5m'),
})

export const resetMfaCache = new Keyv<{
	userIds: string[]
}>(redis, {
	namespace: CACHE_NS.MFA,
	ttl: milliseconds('15m'),
})

const settingCache = new Keyv({ namespace: CACHE_NS.SETTING })

const getSetting = async <T>(key: string): Promise<T> => {
	const data = await settingCache.get<T>(key)
	if (isNil(data)) {
		throw new Error(`Missing cache setting ${key}`)
	}
	return data
}

export const setting = {
	password: async (): Promise<{
		enbAttempt: boolean
		enbExpired: boolean
	}> => {
		const [enbAttempt, enbExpired] = await Promise.all([
			getSetting<boolean>(SETTING.ENB_PASSWORD_ATTEMPT),
			getSetting<boolean>(SETTING.ENB_PASSWORD_EXPIRED),
		])
		return {
			enbAttempt,
			enbExpired,
		}
	},

	enbMFARequired: async (): Promise<boolean> => {
		return getSetting<boolean>(SETTING.ENB_MFA_REQUIRED)
	},

	async enbOnlyOneSession(): Promise<boolean> {
		return getSetting<boolean>(SETTING.ENB_ONLY_ONE_SESSION)
	},
}
