import { Elysia, t } from 'elysia'
import {
	ACTIVITY_TYPE,
	DOC_DETAIL,
	DOC_OPTIONS,
	ErrorResDto,
	IdsDto,
	PREFIX,
	ROUTER,
	ResWrapper,
	authErrors,
	token12,
} from '../common'
import { castToRes, db, ipWhitelistCache, reqMeta } from '../config'
import { activityService, authCheck, permissionCheck } from '../service'
import { CreateIpWhitelistDto, IpWhitelistDto } from './dto'

export const ipWhitelistController = new Elysia({
	name: 'IpWhitelistController',
	detail: { tags: [DOC_OPTIONS.tags.ipWhitelist.name] },
	prefix: ROUTER.IP_WHITELIST.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
	.get('/', async () => castToRes(await db.iPWhitelist.findMany()), {
		beforeHandle: permissionCheck('IPWHITELIST.VIEW'),
		detail: {
			...DOC_DETAIL.IP_WHITELIST_GET_ALL,
			security: [{ accessToken: [] }],
		},
		response: {
			200: ResWrapper(IpWhitelistDto),
			...authErrors,
		},
	})
	.post(
		'/',
		async ({ body: { ip, note }, currentUser, clientIp, userAgent }) => {
			await db.$transaction([
				db.iPWhitelist.create({
					data: { ip, id: token12(PREFIX.IP_WHITELIST), note },
					select: { id: true },
				}),
				activityService.create(
					ACTIVITY_TYPE.CREATE_IP_WHITELIST,
					{ ip },
					{ currentUser, clientIp, userAgent },
				),
			])
			await ipWhitelistCache.delete('IPS')
			return castToRes(null)
		},
		{
			body: CreateIpWhitelistDto,
			beforeHandle: permissionCheck('IPWHITELIST.CREATE'),
			detail: {
				...DOC_DETAIL.IP_WHITELIST_CREATE,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Null()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.IP_WHITELIST.DEL,
		async ({ body: { ids }, currentUser, clientIp, userAgent }) => {
			const ips = await db.iPWhitelist.findMany({
				where: { id: { in: ids } },
			})
			await db.$transaction([
				db.iPWhitelist.deleteMany({ where: { id: { in: ids } } }),
				activityService.create(
					ACTIVITY_TYPE.DEL_IP_WHITELIST,
					{ ips: ips.map(x => x.ip) },
					{ currentUser, clientIp, userAgent },
				),
			])
			await ipWhitelistCache.delete('IPS')
			return castToRes(null)
		},
		{
			body: IdsDto,
			beforeHandle: permissionCheck('IPWHITELIST.DELETE'),
			detail: {
				...DOC_DETAIL.IP_WHITELIST_DEL,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Null()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
