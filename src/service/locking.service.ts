import IORedis from 'ioredis'
import Redis from 'ioredis'
import { Mutex } from 'redis-semaphore'
import { env } from '../config'

const client = new Redis(env.REDIS_URI, {
	password: env.REDIS_PASSWORD,
})

export const lockingService = {
	ensureClient(): IORedis {
		if (!client) {
			throw new Error('Redis is not configured')
		}
		return client
	},

	newMutex(key: string): Mutex {
		return new Mutex(lockingService.ensureClient(), key, { lockTimeout: 2000 })
	},

	async acquire(key: string): Promise<void> {
		const mutex = lockingService.newMutex(key)
		try {
			await mutex.acquire()
		} catch (error) {
			throw new Error(`Failed to acquire lock on ${key}: ${error}`)
		}
	},

	async release(key: string): Promise<void> {
		const mutex = lockingService.newMutex(key)
		try {
			await mutex.release()
		} catch (error) {
			throw new Error(`Failed to release lock on ${key}: ${error}`)
		}
	},

	async lock<T>(key: string, action: () => Promise<T>): Promise<T> {
		const mutex = lockingService.newMutex(key)
		await mutex.acquire()
		try {
			return await action()
		} finally {
			await mutex.release()
		}
	},
}
