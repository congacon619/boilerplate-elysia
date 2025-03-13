import { API_KEY_TYPE, Prisma } from '@prisma/client'
import {
	ACTIVITY_TYPE,
	NotFoundException,
	PERMISSION,
	PREFIX,
	token12,
	token16,
	token32,
} from '../../../common'
import { IPaginationReq, IReqMeta } from '../../../common/type'
import { db, env } from '../../../config'
import { activityService } from '../../activity/service'
import { IUserMeta } from '../../user/type'
import { IPaginateApiKeyRes, IUpsertApiKey } from '../type'

export const apiKeyService = {
	async paginate(
		{ take, skip }: IPaginationReq,
		user: IUserMeta,
	): Promise<IPaginateApiKeyRes> {
		let where: Prisma.ApiKeyWhereInput = {}
		if (!user.permissions.includes(PERMISSION.API_KEY_VIEW_ALL)) {
			where = { userId: user.id }
		}
		const [docs, count] = await Promise.all([
			db.apiKey.findMany({
				where,
				take,
				skip,
				include: { user: { select: { username: true } } },
			}),
			db.apiKey.count({ where }),
		])

		return { docs: docs.map(({ hash, ...rest }) => rest), count }
	},

	async upsert(
		{ name, startDate, endDate, enabled, id }: IUpsertApiKey,
		user: IUserMeta,
		meta: IReqMeta,
	): Promise<{ secret: string; key: string } | undefined> {
		if (!id) {
			const key = token16(env.APP_ENV)
			const secret = token32().toUpperCase()
			const hash = await Bun.password.hash(secret)
			await db.$transaction([
				db.apiKey.create({
					data: {
						id: token12(PREFIX.API_KEY),
						name,
						startDate,
						endDate,
						key,
						hash,
						enabled,
						type: API_KEY_TYPE.PUBLIC,
						userId: user.id,
					},
					select: { id: true },
				}),
				activityService.create({
					type: ACTIVITY_TYPE.CREATE_API_KEY,
					user,
					meta,
					reference: { key },
				}),
			])

			return { secret, key }
		}
		await db.$transaction([
			db.apiKey.update({
				where: { id },
				data: {
					name,
					startDate,
					endDate,
					enabled,
				},
				select: { id: true },
			}),
			activityService.create({
				type: ACTIVITY_TYPE.UPDATE_API_KEY,
				user,
				meta,
				reference: { id },
			}),
		])
	},

	async reset(
		id: string,
		user: IUserMeta,
		meta: IReqMeta,
	): Promise<{ secret: string; key: string }> {
		const apiKey = await db.apiKey.findFirst({ where: { id } })
		if (!apiKey) {
			throw new NotFoundException('exception.not-found')
		}
		const secret = token32().toUpperCase()
		const hash = await Bun.password.hash(secret)
		await db.$transaction([
			db.apiKey.update({
				where: { id },
				data: { hash },
				select: { id: true },
			}),
			activityService.create({
				type: ACTIVITY_TYPE.UPDATE_API_KEY,
				user,
				meta,
				reference: { id },
			}),
		])
		return { secret, key: apiKey.key }
	},
}
