import TelegramBot, { InputMedia } from 'node-telegram-bot-api'
import { ITeleOptions, aes256Decrypt } from '../common'
import { db, env, logger } from '../config'

export const telegramService = {
	async internalSend(payload: {
		userId: TelegramBot.ChatId | TelegramBot.ChatId[]
		message: string
		options?: ITeleOptions
	}): Promise<void> {
		logger.warn('Send tele message', JSON.stringify(payload))
		const { userId, message, options } = payload
		const token = options?.botToken ?? env.TELEGRAM_BOT_TOKEN
		if (!token) {
			logger.error('Telegram bot is not initialized')
			return
		}
		const bot = new TelegramBot(token, {
			polling: false,
			request: {
				url: 'https://api.telegram.org',
				agentOptions: {
					keepAlive: true,
					family: 4,
				},
			},
		})
		let emojiMessage = ''
		if (options?.emoji) {
			switch (options.emoji) {
				case 'check':
					emojiMessage = `✅✅✅ ${message}`
					break
				case 'block':
					emojiMessage = `⛔⛔⛔ ${message}`
					break
				case 'refresh':
					emojiMessage = `♻️♻️♻️ ${message}`
					break
				case 'sos':
					emojiMessage = `🆘🆘🆘 ${message}`
					break
				default:
					emojiMessage = `${options.emoji} ${message}`
			}
		}
		const userIds = Array.isArray(userId) ? userId : [userId]

		await Promise.allSettled(
			userIds.map(async userId => {
				try {
					if (options?.photos?.length === 1 && !options?.videos?.length) {
						await bot.sendPhoto(userId, options.photos[0], {
							...options,
							caption: emojiMessage,
						})
						return
					}

					if (options?.videos?.length === 1 && !options?.photos?.length) {
						await bot.sendVideo(userId, options.videos[0], {
							...options,
							caption: emojiMessage,
						})
						return
					}

					const totalMediaCount =
						(options?.photos?.length ?? 0) + (options?.videos?.length ?? 0)
					if (totalMediaCount > 1) {
						await bot.sendMediaGroup(userId, [
							...(options?.photos?.map(media => ({
								type: 'photo' as const,
								media,
								parse_mode: 'HTML' as const,
								caption: emojiMessage,
							})) ?? []),
							...(options?.videos?.map(media => ({
								type: 'video' as const,
								media,
								parse_mode: 'HTML' as const,
								caption: emojiMessage,
							})) ?? []),
						] satisfies InputMedia[])
					}
					await bot.sendMessage(userId, emojiMessage, {
						parse_mode: 'HTML',
						reply_markup: options?.reply_markup,
					})
					logger.info(`Send message to chat ID ${userId}`)
				} catch (error) {
					logger.error(`Error sending message to chat ID ${userId}:`, error)
				}
			}),
		)
	},

	async sendMessage(
		userId: TelegramBot.ChatId | TelegramBot.ChatId[],
		message: string,
		options?: ITeleOptions,
	): Promise<void> {
		// todo: add queue here
		await telegramService.internalSend({ userId, message, options })
	},

	async getBotToken(id: string | undefined): Promise<string | undefined> {
		if (!id) return
		let botToken: string | undefined
		if (id) {
			const bot = await db.telegramBot.findUnique({
				where: { id },
				select: { token: true },
			})
			botToken = bot?.token && (await aes256Decrypt(bot.token))
		}
		return botToken
	},
}
