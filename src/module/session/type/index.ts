import { t } from 'elysia'

export const SessionPaginateDto = t.Object({
	take: t.Integer({ minimum: 1, example: 20 }),
	cursor: t.Optional(t.String({ example: '123' })),
	revoked: t.Optional(t.Boolean()),
	ip: t.Optional(t.String()),
	created0: t.Date({
		format: 'date-time',
		example: '2023-10-01T00:00:00.000Z',
	}),
	created1: t.Date({
		format: 'date-time',
		example: '2023-10-10T23:59:59.999Z',
	}),
})
export type ISessionPaginate = typeof SessionPaginateDto.static

export const SessionPagingResDto = t.Object({
	docs: t.Array(
		t.Object({
			expired: t.Date(),
			id: t.String(),
			created: t.Date({ format: 'date-time' }),
			createdById: t.String(),
			revoked: t.Boolean(),
			ip: t.Nullable(t.String()),
		}),
	),
	hasNext: t.Boolean(),
	nextCursor: t.Optional(t.String()),
})
export type ISessionPagingRes = typeof SessionPagingResDto.static
