import { Elysia, t } from 'elysia'
import { DOC_DETAIL, DOC_OPTIONS, PERMISSION, ROUTER } from '../../../common'
import {
	ErrorResDto,
	IdDto,
	ResWrapper,
	authErrors,
} from '../../../common/type'
import { castToRes, reqMeta } from '../../../config'
import { authCheck, permissionCheck } from '../../user/auth.middleware'
import { settingService } from '../service'
import { SettingResDto, UpdateSettingDto } from '../type'

export const settingController = new Elysia({
	name: 'SettingController',
	detail: { tags: [DOC_OPTIONS.tags.setting.name] },
	prefix: ROUTER.SETTING.ROOT,
})
	.get('/', async () => castToRes(await settingService.getAll()), {
		detail: DOC_DETAIL.SETTING_GET_ALL,
		response: {
			200: ResWrapper(t.Array(SettingResDto)),
		},
	})
	.use(reqMeta)
	.use(authCheck)
	.post(
		ROUTER.SETTING.UPDATE,
		async ({ body, user, metadata, params }) =>
			castToRes(await settingService.update(params.id, body, user, metadata)),
		{
			beforeHandle: permissionCheck(PERMISSION.SETTING_UPDATE),
			body: UpdateSettingDto,
			params: IdDto,
			detail: {
				...DOC_DETAIL.SETTING_UPDATE,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Void()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
