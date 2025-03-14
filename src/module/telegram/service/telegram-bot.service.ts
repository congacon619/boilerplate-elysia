import {
	ACTIVITY_TYPE,
	IPaginationReq,
	IReqMeta,
	PREFIX,
	aes256Decrypt,
	aes256Encrypt,
	token12,
} from '../../../common'
import { db, logger } from '../../../config'
import { activityService } from '../../activity/service'
import { IUserMeta } from '../../user/type'

export const telegramBotService = {
	async upsert(
		data: IUpsertTelegramBot,
		user: IUserMeta,
		meta: IReqMeta,
	): Promise<void> {
		if (data.id) {
			await db.$transaction([
				db.telegramBot.update({
					where: { id: data.id },
					data: { ...data, token: aes256Encrypt(data.token) },
					select: { id: true },
				}),
				activityService.create({
					type: ACTIVITY_TYPE.UPDATE_TELEGRAM_BOT,
					user,
					meta,
					reference: { id: data.id, name: data.name },
				}),
			])
		} else {
			await db.$transaction(async tx => {
				const createData = await tx.telegramBot.create({
					data: {
						...data,
						id: token12(PREFIX.TELEGRAM_BOT),
						token: aes256Encrypt(data.token),
					},
					select: { id: true },
				})
				await activityService.create(
					{
						type: ACTIVITY_TYPE.CREATE_TELEGRAM_BOT,
						user,
						meta,
						reference: { id: createData.id, name: data.name },
					},
					tx,
				)
			})
		}
	},

	async del(ids: string[], user: IUserMeta, meta: IReqMeta): Promise<void> {
		await db.$transaction([
			db.telegramBot.deleteMany({
				where: { id: { in: ids } },
			}),
			activityService.create({
				type: ACTIVITY_TYPE.DEL_TELEGRAM_BOT,
				user,
				meta,
				reference: { ids },
			}),
		])
	},

	async paginate({
		take,
		skip,
	}: IPaginationReq): Promise<IPagingData<TelegramBot>> {
		const [docs, count] = await Promise.all([
			db.telegramBot.findMany({
				take,
				skip,
			}),
			db.telegramBot.count(),
		])
		return {
			docs: await Promise.all(
				docs.map(async x => {
					let token: string = x.token
					try {
						token = await aes256Decrypt(x.token)
					} catch (error) {
						logger.error(`Wrong decrypt telegram bot token: ${x.id}`, error)
					}
					return { ...x, token }
				}),
			),
			count,
		}
	},
}
