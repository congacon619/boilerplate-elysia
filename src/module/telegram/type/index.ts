import { t } from 'elysia'

export const UpsertTelegramBotDto = t.Object({
	id: t.Optional(t.String()),
	name: t.String(),
	token: t.String(),
	enabled: t.Boolean(),
	description: t.Optional(t.String()),
})
export type IUpsertTelegramBot = typeof UpsertTelegramBotDto.static

export const PaginateTelegramBotResDto = t.Object({
	docs: t.Array(
		t.Intersect([
			t.Omit(UpsertTelegramBotDto, ['description']),
			t.Object({ description: t.Nullable(t.String()) }),
		]),
	),
	count: t.Integer(),
})
export type IPaginateTelegramBotRes = typeof PaginateTelegramBotResDto.static
