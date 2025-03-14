import { IPaginationReq, PREFIX, token12 } from '../../../common'
import { db } from '../../../config'
import { IPaginateTeleChatRes, IUpsertTeleChat } from '../type'

export const telegramChatService = {
	async upsert(data: IUpsertTeleChat): Promise<void> {
		if (data.id) {
			await db.telegramChat.update({
				where: { id: data.id },
				data,
				select: { id: true },
			})
		} else {
			await db.telegramChat.create({
				data: {
					...data,
					id: token12(PREFIX.TELEGRAM_CHAT),
				},
				select: { id: true },
			})
		}
	},

	async del(ids: string[]): Promise<void> {
		await db.telegramChat.deleteMany({
			where: { id: { in: ids } },
		})
	},

	async paginate({
		take,
		skip,
	}: IPaginationReq): Promise<IPaginateTeleChatRes> {
		const [docs, count] = await Promise.all([
			db.telegramChat.findMany({
				take,
				skip,
			}),
			db.telegramChat.count(),
		])
		return {
			docs,
			count,
		}
	},
}
