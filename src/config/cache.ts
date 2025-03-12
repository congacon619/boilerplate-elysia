import Keyv from 'keyv'
import KeyvRedis from '@keyv/redis'
import { env } from './env'
import { CACHE_NS, milliseconds } from '../common'

const redis = new KeyvRedis({
	url: env.REDIS_URI,
	password: env.REDIS_PASSWORD,
})

export const tokenCache = new Keyv<string>(redis, {
	namespace: CACHE_NS.ACCESS_TOKEN,
	ttl: milliseconds(env.JWT_ACCESS_TOKEN_EXPIRED),
})
