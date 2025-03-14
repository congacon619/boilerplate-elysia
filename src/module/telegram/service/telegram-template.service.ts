import { InlineKeyboardButton } from 'node-telegram-bot-api'
import { IPaginationReq, PREFIX, token12 } from '../../../common'
import { db } from '../../../config'
import {
	IPaginateTeleTemplateRes,
	ISendTemplate,
	IUpsertTeleTemplate,
} from '../type'
import { telegramService } from './telegram.service'

export const telegramTemplateService = {
	async upsert({
		id,
		message,
		buttons,
		description,
		name,
		photos,
		videos,
	}: IUpsertTeleTemplate): Promise<void> {
		if (id) {
			await db.telegramTemplate.update({
				where: { id: id },
				data: {
					name,
					description,
					message,
					videos: videos?.length ? videos : [],
					photos: photos?.length ? photos : [],
					buttons: buttons?.length ? buttons : [],
				},
				select: { id: true },
			})
		} else {
			await db.telegramTemplate.create({
				data: {
					name,
					description,
					message,
					videos: videos?.length ? videos : [],
					photos: photos?.length ? photos : [],
					buttons: buttons?.length ? buttons : [],
					id: token12(PREFIX.TELEGRAM_TEMPLATE),
				},
				select: { id: true },
			})
		}
	},

	async del(ids: string[]): Promise<void> {
		await db.telegramTemplate.deleteMany({
			where: { id: { in: ids } },
		})
	},

	async paginate({
		take,
		skip,
	}: IPaginationReq): Promise<IPaginateTeleTemplateRes> {
		const [docs, count] = await Promise.all([
			db.telegramTemplate.findMany({
				take,
				skip,
			}),
			db.telegramTemplate.count(),
		])
		return {
			docs,
			count,
		}
	},

	async sentTemplate(body: ISendTemplate): Promise<void> {
		const [template, chats] = await Promise.all([
			db.telegramTemplate.findUnique({
				where: { id: body.telegramTemplateId },
			}),
			db.telegramChat.findMany({
				where: { id: { in: body.telegramChatIds } },
			}),
		])
		if (!template || !chats.length) {
			return
		}

		await telegramService.jobSendMessage({
			...template,
			chatIds: chats.map(x => x.chatId),
			botId: body.telegramBotId,
			reply_markup: {
				inline_keyboard:
					template.buttons as unknown as InlineKeyboardButton[][],
			},
		})
	},
}
