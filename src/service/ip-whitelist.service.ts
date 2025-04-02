import { inRange, isIP, isPrivateIP, isRange } from 'range_check'
import { PREFIX, UnAuthErr, token12 } from '../common'
import { db, ipWhitelistCache, logger } from '../config'
import { settingService } from './setting.service'

export const ipWhitelistService = {
	canIPAccess(ip: string, whitelist: string[]): boolean {
		if (isPrivateIP(ip)) return true

		return whitelist.some(entry =>
			isRange(entry) ? inRange(ip, entry) : isIP(entry) && ip === entry,
		)
	},

	async createDefaultWhitelistIP(ip: string): Promise<string> {
		await db.iPWhitelist.create({
			data: { id: token12(PREFIX.IP_WHITELIST), ip },
			select: { id: true },
		})
		return ip
	},

	async getWhitelistIPs(ip: string): Promise<string[]> {
		let whitelistIPs = await ipWhitelistCache.get('IPS')

		if (!whitelistIPs?.length) {
			const dbWhitelist = await db.iPWhitelist.findMany()
			whitelistIPs = dbWhitelist.map(entry => entry.ip)
			if (!whitelistIPs.length) {
				const defaultIP = await ipWhitelistService.createDefaultWhitelistIP(ip)
				whitelistIPs = [defaultIP]
			}
			await ipWhitelistCache.set('IPS', whitelistIPs)
		}

		return whitelistIPs
	},

	async preflight(ip: string): Promise<void> {
		if (isPrivateIP(ip) || !(await settingService.enbIpWhitelist())) return
		if (!ip) throw new UnAuthErr('exception.permission-denied')
		const whitelistIPs = await ipWhitelistService.getWhitelistIPs(ip)
		if (!ipWhitelistService.canIPAccess(ip, whitelistIPs)) {
			logger.info(
				`IP ${ip} preflight failed, whitelist IPs: ${whitelistIPs.join(', ')}`,
			)
			throw new UnAuthErr('exception.permission-denied')
		}
	},
}
