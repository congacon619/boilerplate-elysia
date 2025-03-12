import { TSchema, t } from 'elysia'
import { RES_CODE } from '../constant'

export const IdDto = t.Object({ id: t.String() })

export const ResDto = <T extends TSchema>(dataType: T) =>
	t.Object({
		code: t.Enum(RES_CODE),
		t: t.String({ format: 'date-time' }),
		data: dataType,
	})
