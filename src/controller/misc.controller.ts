import dayjs from 'dayjs'
import { Elysia, t } from 'elysia'
import {
	DOC_DETAIL,
	DOC_OPTIONS,
	ErrorResDto,
	HEALTH_STATE,
	ROUTER,
	ResWrapper,
} from '../common'
import { castToRes, env, reqMeta } from '../config'
import { ipWhitelistService, miscService } from '../service'
import { GetTimeDto, GetVersionDto, HealthCheckDto } from './dto'

export const miscController = new Elysia({
	name: 'MiscController',
	detail: { tags: [DOC_OPTIONS.tags.misc.name] },
	prefix: ROUTER.MISC.ROOT,
})
	.get(
		ROUTER.MISC.HEALTH_CHECK,
		async () => {
			try {
				const [disk, redis, prisma] = await Promise.all([
					miscService.checkDiskHealth(),
					miscService.checkRedisHealth(),
					miscService.checkPrismaHealth(),
				])
				return castToRes({
					status: HEALTH_STATE.OK,
					details: { disk, redis, prisma },
				})
			} catch (error) {
				return castToRes({
					status: HEALTH_STATE.ERROR,
					details: null,
					error,
				})
			}
		},
		{
			detail: DOC_DETAIL.HEALTH_CHECK,
			response: {
				200: ResWrapper(HealthCheckDto),
				500: ErrorResDto,
			},
		},
	)
	.get(
		ROUTER.MISC.TIME,
		() =>
			castToRes({
				t: Date.now(),
				time: dayjs().format('ddd, D MMM, H:m:s z'),
			}),
		{
			detail: DOC_DETAIL.GET_TIME,
			response: {
				200: ResWrapper(GetTimeDto),
				500: ErrorResDto,
			},
		},
	)
	.get(
		ROUTER.MISC.VERSION,
		() =>
			castToRes({
				commitHash: env.COMMIT_HASH,
				buildDate: env.BUILD_DATE,
				buildNumber: env.BUILD_NUMBER,
			}),
		{
			detail: DOC_DETAIL.GET_VERSION,
			response: {
				200: ResWrapper(GetVersionDto),
				500: ErrorResDto,
			},
		},
	)
	.use(reqMeta)
	.get(
		ROUTER.MISC.PREFLIGHT,
		async ({ clientIp }) =>
			castToRes(await ipWhitelistService.preflight(clientIp)),
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
