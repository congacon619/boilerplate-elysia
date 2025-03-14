import { IPWhitelist } from '@prisma/client'
import { inRange, isIP, isPrivateIP, isRange } from 'range_check'
import {
	ACTIVITY_TYPE,
	PREFIX,
	UnauthorizedException,
	token12,
} from '../../../common'
import { IReqMeta } from '../../../common/type'
import { db, ipWhitelistCache, logger } from '../../../config'
import { activityService } from '../../activity/service'
import { settingService } from '../../setting/service'
import { IUserMeta } from '../../user/type'
import { ICreateIpWhitelist } from '../type'

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
		if (!ip) throw new UnauthorizedException('exception.permission-denied')
		const whitelistIPs = await ipWhitelistService.getWhitelistIPs(ip)
		if (!ipWhitelistService.canIPAccess(ip, whitelistIPs)) {
			logger.info(
				`IP ${ip} preflight failed, whitelist IPs: ${whitelistIPs.join(', ')}`,
			)
			throw new UnauthorizedException('exception.permission-denied')
		}
	},

	getAll(): Promise<IPWhitelist[]> {
		return db.iPWhitelist.findMany()
	},

	async create(
		{ ip, note }: ICreateIpWhitelist,
		user: IUserMeta,
		meta: IReqMeta,
	): Promise<void> {
		await db.$transaction([
			db.iPWhitelist.create({
				data: { ip, id: token12(PREFIX.IP_WHITELIST), note },
				select: { id: true },
			}),
			activityService.create({
				type: ACTIVITY_TYPE.CREATE_IP_WHITELIST,
				user,
				meta,
			}),
		])
		await ipWhitelistCache.delete('IPS')
	},

	async del(ids: string[], user: IUserMeta, meta: IReqMeta): Promise<void> {
		await db.$transaction([
			db.iPWhitelist.deleteMany({ where: { id: { in: ids } } }),
			activityService.create({
				type: ACTIVITY_TYPE.DEL_IP_WHITELIST,
				user,
				meta,
			}),
		])
		await ipWhitelistCache.delete('IPS')
	},
}
