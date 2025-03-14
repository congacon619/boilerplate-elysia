import { Elysia, t } from 'elysia'
import {
	DOC_DETAIL,
	DOC_OPTIONS,
	ErrorResDto,
	ROUTER,
	ResWrapper,
} from '../../../common'
import { castToRes, reqMeta } from '../../../config'
import { ipWhitelistService } from '../../ip-whitelist/service'
import { miscService } from '../service'
import { GetTimeDto, GetVersionDto, HealthCheckDto } from '../type'

export const miscController = new Elysia({
	name: 'MiscController',
	detail: { tags: [DOC_OPTIONS.tags.misc.name] },
	prefix: ROUTER.MISC.ROOT,
})
	.get(
		ROUTER.MISC.HEALTH_CHECK,
		async () => castToRes(await miscService.healthcheck()),
		{
			detail: DOC_DETAIL.HEALTH_CHECK,
			response: {
				200: ResWrapper(HealthCheckDto),
				500: ErrorResDto,
			},
		},
	)
	.get(ROUTER.MISC.TIME, () => castToRes(miscService.getTime()), {
		detail: DOC_DETAIL.GET_TIME,
		response: {
			200: ResWrapper(GetTimeDto),
			500: ErrorResDto,
		},
	})
	.get(ROUTER.MISC.VERSION, () => castToRes(miscService.getVersion()), {
		detail: DOC_DETAIL.GET_VERSION,
		response: {
			200: ResWrapper(GetVersionDto),
			500: ErrorResDto,
		},
	})
	.use(reqMeta)
	.get(
		ROUTER.MISC.PREFLIGHT,
		async ({ metadata: { ip } }) =>
			castToRes(await ipWhitelistService.preflight(ip)),
		{
			detail: DOC_DETAIL.PREFLIGHT,
			response: {
				200: ResWrapper(t.Void()),
				500: ErrorResDto,
				401: ErrorResDto,
				403: ErrorResDto,
			},
		},
	)
