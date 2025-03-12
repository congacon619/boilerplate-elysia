import { TSchema, t } from 'elysia'
import { HTTP_STATUS, RES_CODE } from '../constant'

export const IdDto = t.Object({ id: t.String() })

export const ResDto = <T extends TSchema>(dataType: T) =>
	t.Object({
		code: t.Enum(RES_CODE),
		t: t.String({ format: 'date-time' }),
		data: dataType,
	})

export const ErrorResDto = t.Object({
	code: t.Enum(RES_CODE),
	t: t.String({ format: 'date-time' }),
	message: t.String(),
	errors: t.Optional(t.Any()),
	statusCode: t.Enum(HTTP_STATUS),
})

export type IErrorRes = typeof ErrorResDto.static
