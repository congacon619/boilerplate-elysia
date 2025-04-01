import { Type } from '@sinclair/typebox'
import { t } from 'elysia'

export const I18nDto = t.Object({
	id: t.String(),
	key: t.String(),
	en: t.Nullable(t.String()),
	zh: t.Nullable(t.String()),
	vi: t.Nullable(t.String()),
	ko: t.Nullable(t.String()),
})

export const PaginateI18nResDto = t.Object({
	docs: t.Array(I18nDto),
	count: t.Integer(),
})

export const I18nPaginationDto = t.Object({
	key: t.Optional(t.String()),
	take: t.Optional(t.Integer({ minimum: 1, examples: [20], default: 20 })),
	skip: t.Optional(t.Integer({ minimum: 0, examples: [0], default: 0 })),
})

export const I18nUpsertDto = t.Intersect([
	t.Omit(I18nDto, ['id']),
	t.Object({ id: t.Optional(t.String()) }),
])

export const I18NImportDto = Type.Object({
	KEY: Type.String(),
	EN: Type.Optional(Type.String()),
	ZH: Type.Optional(Type.String()),
	KO: Type.Optional(Type.String()),
	VI: Type.Optional(Type.String()),
})
