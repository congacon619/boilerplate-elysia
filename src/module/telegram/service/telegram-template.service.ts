import { IPaginationReq, PREFIX, token12 } from '../../../common'
import { db } from '../../../config'
import { IPaginateTeleTemplateRes, IUpsertTeleTemplate } from '../type'

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
}
