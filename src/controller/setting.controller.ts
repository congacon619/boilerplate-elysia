import { Elysia, t } from 'elysia'
import {
	ACTIVITY_TYPE,
	BadReqErr,
	DOC_DETAIL,
	DOC_OPTIONS,
	ErrorResDto,
	IdDto,
	NotFoundErr,
	ROUTER,
	ResWrapper,
	aes256Decrypt,
	aes256Encrypt,
	authErrors,
} from '../common'
import { castToRes, db, reqMeta, settingCache } from '../config'
import {
	activityService,
	authCheck,
	permissionCheck,
	settingService,
} from '../service'
import { SettingResDto, UpdateSettingDto } from './dto'

export const settingController = new Elysia({
	name: 'SettingController',
	detail: { tags: [DOC_OPTIONS.tags.setting.name] },
	prefix: ROUTER.SETTING.ROOT,
})
	.get(
		'/',
		async () => {
			const settings = await db.setting.findMany()
			return castToRes(
				await Promise.all(
					settings.map(async x => {
						if (x.encrypted) {
							try {
								x.value = await aes256Decrypt(x.value)
							} catch {}
						}
						return x
					}),
				),
			)
		},
		{
			detail: DOC_DETAIL.SETTING_GET_ALL,
			response: {
				200: ResWrapper(t.Array(SettingResDto)),
			},
		},
	)
	.use(reqMeta)
	.use(authCheck)
	.post(
		ROUTER.SETTING.UPDATE,
		async ({
			body: { value, encrypted },
			params: { id },
			currentUser,
			clientIp,
			userAgent,
		}) => {
			const setting = await db.setting.findUnique({
				where: { id },
				select: { value: true, type: true },
			})
			if (!setting) {
				throw new NotFoundErr('exception.item-not-found', {
					args: { item: `Setting with id ${id}` },
				})
			}
			if (!settingService.checkValue(value, setting.type)) {
				throw new BadReqErr('exception.bad-request')
			}
			const newValue = encrypted ? await aes256Encrypt(value) : value
			const updated = await db.$transaction(async tx => {
				const res = await tx.setting.update({
					where: { id },
					data: {
						value: newValue,
						encrypted,
					},
				})
				await activityService.create(
					ACTIVITY_TYPE.UPDATE_SETTING,
					{ key: res.key, value: newValue },
					{ currentUser, clientIp, userAgent },
					tx,
				)
				return res
			})
			await settingCache.set(
				updated.key,
				await settingService.getValue(updated),
			)
			return castToRes(null)
		},
		{
			beforeHandle: permissionCheck('SETTING.UPDATE'),
			body: UpdateSettingDto,
			params: IdDto,
			detail: {
				...DOC_DETAIL.SETTING_UPDATE,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Null()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
