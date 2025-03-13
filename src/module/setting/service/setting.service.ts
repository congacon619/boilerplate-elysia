import { SETTING_DATA_TYPE, Setting } from '@prisma/client'
import { Type } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'
import { isNil } from 'lodash'
import {
	ACTIVITY_TYPE,
	BadRequestException,
	NotFoundException,
	SETTING,
	aes256Decrypt,
	aes256Encrypt,
} from '../../../common'
import { IReqMeta } from '../../../common/type'
import { db, settingCache } from '../../../config'
import { activityService } from '../../activity/service'
import { IUserMeta } from '../../user/type'
import { IUpdateSetting } from '../type'

export const settingService = {
	async getValue<T>(setting: Setting, raw = false): Promise<T> {
		let value: string = setting.value
		if (setting.encrypted) {
			value = await aes256Decrypt(value)
		}
		if (raw) {
			return value as T
		}
		switch (setting.type) {
			case SETTING_DATA_TYPE.BOOLEAN:
				return (value === 'true') as T
			case SETTING_DATA_TYPE.NUMBER: {
				const numValue = Number(value)
				return (Number.isNaN(numValue) ? 0 : numValue) as T
			}
			case SETTING_DATA_TYPE.DATE: {
				const dateValue = new Date(value)
				return (
					Number.isNaN(dateValue.getTime()) ? new Date(0) : dateValue
				) as T
			}
			default:
				return value as T
		}
	},

	async getAll(): Promise<Setting[]> {
		const settings = await db.setting.findMany()

		return await Promise.all(
			settings.map(async x => {
				if (x.encrypted) {
					try {
						x.value = await aes256Decrypt(x.value)
					} catch {}
				}
				return x
			}),
		)
	},

	async update(
		id: string,
		{ value, encrypted }: IUpdateSetting,
		user: IUserMeta,
		meta: IReqMeta,
	): Promise<void> {
		const setting = await db.setting.findUnique({
			where: { id },
			select: { value: true, type: true },
		})
		if (!setting) {
			throw new NotFoundException('exception.item-not-found', {
				args: { item: `Setting with id ${id}` },
			})
		}
		if (!settingService.checkValue(value, setting.type)) {
			throw new BadRequestException('exception.bad-request')
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
				{
					type: ACTIVITY_TYPE.UPDATE_SETTING,
					meta,
					user,
					reference: { id },
				},
				tx,
			)
			return res
		})
		await settingCache.set(updated.key, await settingService.getValue(updated))
	},

	checkValue(value: string, type: SETTING_DATA_TYPE): boolean {
		const schemaMap = {
			BOOLEAN: Type.Union([Type.Literal('true'), Type.Literal('false')]),
			NUMBER: Type.String({ pattern: '^-?\\d+(\\.\\d+)?$' }),
			STRING: Type.String(),
			DATE: Type.String({ format: 'date-time' }),
		}
		return Value.Check(schemaMap[type], value)
	},

	async getSetting<T>(key: string): Promise<T> {
		const cachedValue = await settingCache.get<T>(key)
		if (!isNil(cachedValue)) {
			return cachedValue
		}
		const setting = await db.setting.findUnique({ where: { key } })
		if (!setting) {
			throw new Error(`Missing setting key ${key}`)
		}
		const value = await settingService.getValue<T>(setting)
		await settingCache.set(key, value)
		return value
	},

	async password(): Promise<{
		enbAttempt: boolean
		enbExpired: boolean
	}> {
		const [enbAttempt, enbExpired] = await Promise.all([
			settingService.getSetting<boolean>(SETTING.ENB_PASSWORD_ATTEMPT),
			settingService.getSetting<boolean>(SETTING.ENB_PASSWORD_EXPIRED),
		])
		return {
			enbAttempt,
			enbExpired,
		}
	},

	async enbMFARequired(): Promise<boolean> {
		return settingService.getSetting<boolean>(SETTING.ENB_MFA_REQUIRED)
	},

	async enbOnlyOneSession(): Promise<boolean> {
		return settingService.getSetting<boolean>(SETTING.ENB_ONLY_ONE_SESSION)
	},

	async enbIpWhitelist(): Promise<boolean> {
		return settingService.getSetting<boolean>(SETTING.ENB_IP_WHITELIST)
	},
}
