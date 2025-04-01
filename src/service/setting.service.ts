import { SETTING_DATA_TYPE, Setting } from '@prisma/client'
import { Type } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'
import { isNil } from 'lodash'
import { SETTING, aes256Decrypt } from '../common'
import { db, settingCache } from '../config'

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
