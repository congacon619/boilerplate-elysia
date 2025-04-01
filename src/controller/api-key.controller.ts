import { API_KEY_TYPE, Prisma } from '@prisma/client'
import { Elysia } from 'elysia'
import {
	ACTIVITY_TYPE,
	DOC_DETAIL,
	DOC_OPTIONS,
	ErrorResDto,
	IdDto,
	NotFoundException,
	PERMISSION,
	PREFIX,
	PaginationReqDto,
	ROUTER,
	ResWrapper,
	authErrors,
	token12,
	token16,
	token32,
} from '../common'
import { castToRes, db, env, reqMeta } from '../config'
import {
	activityService,
	apiKeyService,
	authCheck,
	permissionCheck,
} from '../service'
import {
	PaginateApiKeyResDto,
	ResetApiKeyDto,
	UpsertApiKeyDto,
	UpsertApiKeyResDto,
} from './dto'

export const apiKeyController = new Elysia({
	name: 'ApiKeyController',
	detail: { tags: [DOC_OPTIONS.tags.apiKey.name] },
	prefix: ROUTER.API_KEY.ROOT,
})
	.use(reqMeta)
	.use(authCheck)
	.get(
		'/',
		async ({ query: { take, skip }, currentUser }) => {
			let where: Prisma.ApiKeyWhereInput = {}
			if (!currentUser.permissions.includes(PERMISSION.API_KEY_VIEW_ALL)) {
				where = { userId: currentUser.id }
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

			return castToRes({ docs: docs.map(({ hash, ...rest }) => rest), count })
		},
		{
			beforeHandle: permissionCheck(PERMISSION.API_KEY_VIEW),
			query: PaginationReqDto,
			detail: {
				...DOC_DETAIL.API_KEY_PAGINATE,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(PaginateApiKeyResDto),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.post(
		'/',
		async ({
			body: { id, enabled, startDate, endDate, name },
			currentUser,
			clientIp,
			userAgent,
		}) => {
			if (!id) {
				const key = token16(env.APP_ENV)
				const secret = token32().toUpperCase()
				const hash = await Bun.password.hash(secret)
				await db.$transaction(async tx => {
					const newApiKey = await tx.apiKey.create({
						data: {
							id: token12(PREFIX.API_KEY),
							name,
							startDate,
							endDate,
							key,
							hash,
							enabled,
							type: API_KEY_TYPE.PUBLIC,
							userId: currentUser.id,
						},
						select: { id: true },
					})
					activityService.create(
						ACTIVITY_TYPE.CREATE_API_KEY,
						{ id: newApiKey.id },
						{
							currentUser,
							clientIp,
							userAgent,
						},
						tx,
					)
				})

				return castToRes({ secret, key })
			}
			const exist = await db.apiKey.findFirst({
				where: { id },
				select: { userId: true },
			})
			apiKeyService.validatePermission(exist, currentUser)
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
				activityService.create(
					ACTIVITY_TYPE.UPDATE_API_KEY,
					{ id },
					{
						currentUser,
						clientIp,
						userAgent,
					},
				),
			])
			return castToRes(null)
		},
		{
			beforeHandle: permissionCheck(PERMISSION.API_KEY_UPDATE),
			body: UpsertApiKeyDto,
			detail: {
				...DOC_DETAIL.API_KEY_UPSERT,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(UpsertApiKeyResDto),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.API_KEY.RESET,
		async ({ params: { id }, currentUser, clientIp, userAgent }) => {
			const apiKey = await db.apiKey.findFirst({
				where: { id },
				select: { userId: true, key: true },
			})
			if (!apiKey) {
				throw new NotFoundException('exception.api-key-not-found')
			}
			apiKeyService.validatePermission(apiKey, currentUser)
			const secret = token32().toUpperCase()
			const hash = await Bun.password.hash(secret)
			await db.$transaction([
				db.apiKey.update({
					where: { id },
					data: { hash },
					select: { id: true },
				}),
				activityService.create(
					ACTIVITY_TYPE.UPDATE_API_KEY,
					{ id },
					{
						currentUser,
						clientIp,
						userAgent,
					},
				),
			])
			return castToRes({ secret, key: apiKey.key })
		},
		{
			beforeHandle: permissionCheck(PERMISSION.API_KEY_UPDATE),
			params: IdDto,
			detail: {
				...DOC_DETAIL.API_KEY_RESET,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(ResetApiKeyDto),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
