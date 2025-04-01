import os from 'node:os'
import { HEALTH_STATE } from '../common'
import { db, tokenCache } from '../config'

export const miscService = {
	async checkDiskHealth(thresholdPercent = 0.75) {
		return new Promise((resolve, reject) => {
			const total = os.totalmem() / (1024 * 1024)
			const free = os.freemem() / (1024 * 1024)
			const usedPercent = (total - free) / total

			if (usedPercent >= thresholdPercent) {
				return reject({
					status: HEALTH_STATE.ERROR,
					error: 'Disk usage exceeded threshold',
				})
			}

			resolve({
				status: HEALTH_STATE.OK,
				freeMB: free.toFixed(2),
				totalMB: total.toFixed(2),
			})
		})
	},

	async checkRedisHealth() {
		try {
			await tokenCache.set('healthcheck', HEALTH_STATE.OK, 5000)
			const value = await tokenCache.get('healthcheck')
			return {
				status:
					value === HEALTH_STATE.OK ? HEALTH_STATE.OK : HEALTH_STATE.ERROR,
			}
		} catch (error) {
			return { status: HEALTH_STATE.ERROR, error }
		}
	},

	async checkPrismaHealth() {
		try {
			await db.$queryRaw`SELECT 1`
			return { status: HEALTH_STATE.OK }
		} catch (error) {
			return { status: HEALTH_STATE.ERROR, error }
		}
	},
}
