import { t } from 'elysia'

export const UpsertApiKeyDto = t.Object({
	id: t.Optional(t.String()),
	startDate: t.Optional(t.Date()),
	endDate: t.Optional(t.Date()),
	name: t.String(),
	enabled: t.Boolean(),
})
export type IUpsertApiKey = typeof UpsertApiKeyDto.static

export const PaginateApiKeyResDto = t.Object({
	docs: t.Array(
		t.Intersect([
			t.Omit(UpsertApiKeyDto, ['startDate', 'endDate']),
			t.Object({
				id: t.String(),
				key: t.String(),
				created: t.Date(),
				user: t.Object({ username: t.String() }),
				endDate: t.Optional(t.Nullable(t.Date())),
				startDate: t.Optional(t.Nullable(t.Date())),
			}),
		]),
	),
	count: t.Integer(),
})
export type IPaginateApiKeyRes = typeof PaginateApiKeyResDto.static

export const ResetApiKeyDto = t.Object({
	secret: t.String(),
	key: t.String(),
})

export const UpsertApiKeyResDto = t.Optional(ResetApiKeyDto)
