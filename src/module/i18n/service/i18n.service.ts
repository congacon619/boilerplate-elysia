import { Prisma } from '@prisma/client'
import { AppException, HTTP_STATUS, PREFIX, token12 } from '../../../common'
import { db } from '../../../config'
import { II18nPagination, II18nUpsert, IPaginateI18nRes } from '../type'

export const i18nService = {
	async paginate({
		skip,
		take,
		key,
	}: II18nPagination): Promise<IPaginateI18nRes> {
		const where: Prisma.I18nWhereInput = key ? { key: { contains: key } } : {}
		const [docs, count] = await Promise.all([
			db.i18n.findMany({
				where,
				orderBy: { key: 'asc' },
				skip,
				take,
			}),
			db.i18n.count({ where: { key: { contains: key } } }),
		])
		return { docs, count }
	},

	async upsert(data: II18nUpsert): Promise<void> {
		const where: Prisma.I18nWhereInput[] = [{ key: data.key }]
		if (data.id) {
			where.push({ id: { not: data.id } })
		}
		const exist = await db.i18n.findFirst({
			where: { AND: where },
			select: { id: true },
		})
		if (exist) {
			throw new AppException(
				'exception.item-exists',
				HTTP_STATUS.HTTP_409_CONFLICT,
				{
					args: { item: `I18N key ${data.key} ` },
				},
			)
		}

		if (data.id) {
			await db.i18n.update({
				where: { id: data.id },
				data,
				select: { id: true },
			})
		} else {
			await db.i18n.create({
				data: { ...data, id: token12(PREFIX.I18N) },
				select: { id: true },
			})
		}
	},

	async del(ids: string[]): Promise<void> {
		await db.i18n.deleteMany({
			where: { id: { in: ids } },
		})
	},
}
