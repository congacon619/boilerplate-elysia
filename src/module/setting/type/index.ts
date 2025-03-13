import { SETTING_DATA_TYPE } from '@prisma/client'
import { t } from 'elysia'

export const SettingResDto = t.Object({
	id: t.String(),
	key: t.String(),
	description: t.Nullable(t.String()),
	type: t.Enum(SETTING_DATA_TYPE),
	value: t.String(),
})

export const UpdateSettingDto = t.Object({
	value: t.String(),
	encrypted: t.Boolean(),
})
export type IUpdateSetting = typeof UpdateSettingDto.static
