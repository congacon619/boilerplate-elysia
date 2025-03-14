import { Elysia, t } from 'elysia'
import { DOC_DETAIL, DOC_OPTIONS, PERMISSION, ROUTER } from '../../../common'
import {
	ErrorResDto,
	IdsDto,
	ResWrapper,
	authErrors,
} from '../../../common/type'
import { castToRes, reqMeta } from '../../../config'
import { authCheck, permissionCheck } from '../../user/auth.middleware'
import { ipWhitelistService } from '../service'
import { CreateIpWhitelistDto, IpWhitelistDto } from '../type'

export const ipWhitelistController = new Elysia({
	name: 'IpWhitelistController',
	detail: { tags: [DOC_OPTIONS.tags.ipWhitelist.name] },
	prefix: ROUTER.IP_WHITELIST.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
	.get('/', async () => castToRes(await ipWhitelistService.getAll()), {
		beforeHandle: permissionCheck(PERMISSION.IP_WHITELIST_VIEW),
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
		async ({ body, user, metadata }) =>
			castToRes(await ipWhitelistService.create(body, user, metadata)),
		{
			body: CreateIpWhitelistDto,
			beforeHandle: permissionCheck(PERMISSION.IP_WHITELIST_CREATE),
			detail: {
				...DOC_DETAIL.IP_WHITELIST_CREATE,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Void()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.IP_WHITELIST.DEL,
		async ({ body, user, metadata }) =>
			castToRes(await ipWhitelistService.del(body.ids, user, metadata)),
		{
			body: IdsDto,
			beforeHandle: permissionCheck(PERMISSION.IP_WHITELIST_DELETE),
			detail: {
				...DOC_DETAIL.IP_WHITELIST_DEL,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Void()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
