import { inRange, isIP, isPrivateIP, isRange } from 'range_check'
import { AppException, PREFIX, token12 } from '../../../common'
import { db, ipWhitelistCache, logger } from '../../../config'
import { settingService } from '../../setting/service'

export const ipWhitelistService = {
	canIPAccess(ip: string, whitelist: string[]): boolean {
		if (isPrivateIP(ip)) {
			return true
		}

		return whitelist.some(entry => {
			if (isRange(entry)) {
				return inRange(ip, entry)
			}
			if (isIP(entry)) {
				return ip === entry
			}
			return false
		})
	},

	async preflight(ip: string): Promise<void> {
		const enbIpWhitelist = await settingService.enbIpWhitelist()
		if (!isPrivateIP(ip) && enbIpWhitelist) {
			if (!ip) {
				throw new AppException('exception.permission-denied')
			}
			let whitelistIPs = await ipWhitelistCache.get('IPS')

			if (!whitelistIPs || whitelistIPs.length === 0) {
				const dbWhitelist = await db.iPWhitelist.findMany()

				if (dbWhitelist.length === 0) {
					await db.iPWhitelist.create({
						data: {
							id: token12(PREFIX.IP_WHITELIST),
							ip,
						},
						select: { id: true },
					})
					whitelistIPs = [ip]
				} else {
					whitelistIPs = dbWhitelist.map(entry => entry.ip)
				}
				await ipWhitelistCache.set('IPS', whitelistIPs)
			}

			if (
				!whitelistIPs ||
				whitelistIPs.length === 0 ||
				!ipWhitelistService.canIPAccess(ip, whitelistIPs)
			) {
				logger.info(
					`IP ${ip} preflight failed, whitelist IPs are: ${whitelistIPs.join(', ')}`,
				)
				throw new AppException('exception.permission-denied')
			}
		}
	},
}
