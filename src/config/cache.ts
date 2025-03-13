import KeyvRedis from '@keyv/redis'
import Keyv from 'keyv'
import { CACHE_NS, milliseconds } from '../common'
import { MFA_METHOD } from '../module/user/constant'
import { IUserMeta } from '../module/user/type'
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

export const ipWhitelistCache = new Keyv<string[]>(redis, {
	namespace: CACHE_NS.IP_WHITELIST,
	ttl: milliseconds('15m'),
})

export const currentUserCache = new Keyv<IUserMeta>(redis, {
	namespace: CACHE_NS.CURRENT_USER,
	ttl: milliseconds('5m'),
})

export const settingCache = new Keyv({ namespace: CACHE_NS.SETTING })

export const changePasswordCache = new Keyv<{ userId: string }>(redis, {
	namespace: CACHE_NS.CHANGE_PASSWORD,
	ttl: milliseconds('15m'),
})
