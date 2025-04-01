import { TSchema, t } from 'elysia'
import { HTTP_STATUS, RES_CODE } from '../constant'

export const IdDto = t.Object({ id: t.String({ minLength: 1 }) })
export const IdsDto = t.Object({
	ids: t.Array(t.String({ minLength: 1 }), { minItems: 1 }),
})

export const ErrorResDto = t.Object({
	code: t.Enum(RES_CODE),
	t: t.String({ format: 'date-time' }),
	message: t.String(),
	errors: t.Optional(t.Any()),
	statusCode: t.Enum(HTTP_STATUS),
})

export type IErrorRes = typeof ErrorResDto.static

export const authErrors = {
	401: ErrorResDto,
	403: ErrorResDto,
	500: ErrorResDto,
}

export const ResWrapper = <T extends TSchema>(dataSchema: T) =>
	t.Object({
		data: dataSchema,
		t: t.String(),
		code: t.String(),
	})

export const PaginationReqDto = t.Object({
	take: t.Optional(t.Integer({ minimum: 1, examples: [20], default: 20 })),
	skip: t.Optional(t.Integer({ minimum: 0, examples: [0], default: 0 })),
})
