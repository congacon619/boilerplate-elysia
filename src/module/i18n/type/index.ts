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
export type IPaginateI18nRes = typeof PaginateI18nResDto.static

export const I18nPaginationDto = t.Object({
	key: t.Optional(t.String()),
	take: t.Optional(t.Integer({ minimum: 1, examples: [20], default: 20 })),
	skip: t.Optional(t.Integer({ minimum: 0, examples: [0], default: 0 })),
})
export type II18nPagination = typeof I18nPaginationDto.static

export const I18nUpsertDto = t.Intersect([
	t.Omit(I18nDto, ['id']),
	t.Object({ id: t.Optional(t.String()) }),
])
export type II18nUpsert = typeof I18nUpsertDto.static

export const I18NImportDto = Type.Object({
	KEY: Type.String(),
	EN: Type.Optional(Type.String()),
	ZH: Type.Optional(Type.String()),
	KR: Type.Optional(Type.String()),
	VI: Type.Optional(Type.String()),
})
export type I18NImport = typeof I18NImportDto.static
