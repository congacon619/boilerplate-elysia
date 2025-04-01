import TelegramBot, {
	InputMedia,
	SendMediaGroupOptions,
} from 'node-telegram-bot-api'
import { ITelegramMessage, TASK_NAME, aes256Decrypt } from '../common'
import { db, logger, teleQueue } from '../config'

export const telegramService = {
	async jobSendMessage(data: ITelegramMessage): Promise<void> {
		await teleQueue.add(TASK_NAME.SEND_TELEGRAM_MESSAGE, data, {
			removeOnComplete: false,
			removeOnFail: false,
		})
	},

	async sendMessage(data: ITelegramMessage): Promise<void> {
		const bot = await db.telegramBot.findFirst({
			where: data.botId ? { id: data.botId } : { enabled: true },
			select: { token: true },
		})
		if (!bot) {
			logger.error('Telegram bot is not initialized')
			return
		}
		const teleBot: TelegramBot = new TelegramBot(
			await aes256Decrypt(bot.token),
			{
				polling: false,
				request: {
					url: 'https://api.telegram.org',
					agentOptions: {
						keepAlive: true,
						family: 4,
					},
				},
			},
		)

		const options = {
			parse_mode: 'HTML' as const,
			reply_markup: data.reply_markup,
		}

		await Promise.allSettled(
			data.chatIds.map(async chatId => {
				try {
					if (data.photos?.length === 1 && !data.videos?.length) {
						await teleBot.sendPhoto(chatId, data.photos[0], {
							...options,
							caption: data.message ?? '',
						})
						return
					}

					if (data.videos?.length === 1 && !data.photos?.length) {
						await teleBot.sendVideo(chatId, data.videos[0], {
							...options,
							caption: data.message ?? '',
						})
						return
					}

					const totalMediaCount =
						(data.photos?.length ?? 0) + (data.videos?.length ?? 0)
					if (totalMediaCount > 1) {
						const media: InputMedia[] = [
							...(data.photos?.map(photo => ({
								type: 'photo' as const,
								media: photo,
							})) ?? []),
							...(data.videos?.map(video => ({
								type: 'video' as const,
								media: video,
							})) ?? []),
						]

						if (media.length) {
							await teleBot.sendMediaGroup(
								chatId,
								media,
								options as SendMediaGroupOptions,
							)
						}
						if (data.message) {
							await teleBot.sendMessage(chatId, data.message, options)
						}
						return
					}

					if (data.message) {
						await teleBot.sendMessage(chatId, data.message, options)
					}
				} catch (error) {
					logger.error(`Error sending message to chat ID ${chatId}:`, error)
				}
			}),
		)
	},
}
