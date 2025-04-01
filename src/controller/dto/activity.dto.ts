import { t } from 'elysia'

export const ActivityPaginateDto = t.Object({
	take: t.Integer({ minimum: 1, example: 20 }),
	cursor: t.Optional(t.String({ example: '123' })),
	type: t.Optional(t.String({ example: 'Login' })),
	ip: t.Optional(t.String()),
	sessionId: t.Optional(t.String()),
	created0: t.Date({
		format: 'date-time',
		example: '2023-10-01T00:00:00.000Z',
	}),
	created1: t.Date({
		format: 'date-time',
		example: '2023-10-10T23:59:59.999Z',
	}),
})

export const ActivityPagingResDto = t.Object({
	docs: t.Array(
		t.Object({
			id: t.String(),
			created: t.Date({ format: 'date-time' }),
			createdById: t.String(),
			description: t.Nullable(t.String()),
			device: t.Nullable(t.String()),
			ip: t.Nullable(t.String()),
			reference: t.Unknown(),
			type: t.String(),
			sessionId: t.Nullable(t.String()),
		}),
	),
	hasNext: t.Boolean(),
	nextCursor: t.Optional(t.String()),
})
