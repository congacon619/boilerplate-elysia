import { TELEGRAM_CHAT_TYPE } from '@prisma/client'
import { t } from 'elysia'

export const UpsertTeleBotDto = t.Object({
	id: t.Optional(t.String()),
	name: t.String(),
	token: t.String(),
	enabled: t.Boolean(),
	description: t.Optional(t.String()),
})
export type IUpsertTeleBot = typeof UpsertTeleBotDto.static

export const PaginateTeleBotResDto = t.Object({
	docs: t.Array(
		t.Intersect([
			t.Omit(UpsertTeleBotDto, ['description']),
			t.Object({ description: t.Nullable(t.String()) }),
		]),
	),
	count: t.Integer(),
})
export type IPaginateTeleBotRes = typeof PaginateTeleBotResDto.static

export const UpsertTeleChatDto = t.Object({
	id: t.Optional(t.String()),
	name: t.String(),
	description: t.Optional(t.String()),
	chatId: t.String(),
	type: t.Enum(TELEGRAM_CHAT_TYPE),
})
export type IUpsertTeleChat = typeof UpsertTeleChatDto.static

export const PaginateTeleChatResDto = t.Object({
	docs: t.Array(
		t.Intersect([
			t.Omit(UpsertTeleChatDto, ['description']),
			t.Object({ description: t.Nullable(t.String()) }),
		]),
	),
	count: t.Integer(),
})
export type IPaginateTeleChatRes = typeof PaginateTeleChatResDto.static

export const UpsertTeleTemplateDto = t.Object({
	id: t.Optional(t.String()),
	name: t.String(),
	description: t.Optional(t.String()),
	message: t.Optional(t.String()),
	photos: t.Optional(t.Array(t.String())),
	videos: t.Optional(t.Array(t.String())),
	buttons: t.Optional(t.Any()),
})
export type IUpsertTeleTemplate = typeof UpsertTeleTemplateDto.static

export const PaginateTeleTemplateResDto = t.Object({
	docs: t.Array(
		t.Intersect([
			t.Omit(UpsertTeleTemplateDto, ['description', 'message']),
			t.Object({
				description: t.Nullable(t.String()),
				message: t.Nullable(t.String()),
			}),
		]),
	),
	count: t.Integer(),
})
export type IPaginateTeleTemplateRes = typeof PaginateTeleTemplateResDto.static

export const SendTemplateDto = t.Object({
	telegramTemplateId: t.String(),
	telegramChatIds: t.Array(t.String(), { minItems: 1 }),
	telegramBotId: t.Optional(t.String()),
})
export type ISendTemplate = typeof SendTemplateDto.static

export const SendTelegramMessageDto = t.Composite([
	t.Omit(UpsertTeleTemplateDto, ['id', 'name', 'description']),
	t.Object({
		telegramBotId: t.Optional(t.String()),
		chatIds: t.Array(t.String(), { minItems: 1 }),
	}),
])
