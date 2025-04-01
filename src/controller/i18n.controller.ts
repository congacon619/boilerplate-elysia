import { Prisma } from '@prisma/client'
import { Elysia, t } from 'elysia'
import {
	AppException,
	DOC_DETAIL,
	DOC_OPTIONS,
	ErrorResDto,
	HTTP_STATUS,
	IdsDto,
	PERMISSION,
	PREFIX,
	ROUTER,
	ResWrapper,
	authErrors,
	token12,
} from '../common'
import { castToRes, db, reqMeta } from '../config'
import { authCheck, permissionCheck } from '../service'
import { I18nPaginationDto, I18nUpsertDto, PaginateI18nResDto } from './dto'

export const i18nController = new Elysia({
	name: 'I18nController',
	detail: { tags: [DOC_OPTIONS.tags.i18n.name] },
	prefix: ROUTER.I18N.ROOT,
})
	.get(
		'/',
		async ({ query: { key, take, skip } }) => {
			const where: Prisma.I18nWhereInput = key ? { key: { contains: key } } : {}
			const [docs, count] = await Promise.all([
				db.i18n.findMany({
					where,
					orderBy: { key: 'asc' },
					skip,
					take,
				}),
				db.i18n.count({ where }),
			])
			return castToRes({ docs, count })
		},
		{
			query: I18nPaginationDto,
			detail: DOC_DETAIL.I18N_GET_ALL,
			response: {
				200: ResWrapper(PaginateI18nResDto),
				500: ErrorResDto,
			},
		},
	)
	.use(reqMeta)
	.use(authCheck)
	.post(
		'/',
		async ({ body }) => {
			const where: Prisma.I18nWhereInput[] = [{ key: body.key }]
			if (body.id) {
				where.push({ id: { not: body.id } })
			}
			const exist = await db.i18n.findFirst({
				where: { AND: where },
				select: { id: true },
			})
			if (exist) {
				throw new AppException(
					'exception.item-exists',
					HTTP_STATUS.HTTP_409_CONFLICT,
					{ args: { item: `I18N key ${body.key} ` } },
				)
			}

			if (body.id) {
				await db.i18n.update({
					where: { id: body.id },
					data: body,
					select: { id: true },
				})
			} else {
				await db.i18n.create({
					data: { ...body, id: token12(PREFIX.I18N) },
					select: { id: true },
				})
			}
			return castToRes(null)
		},
		{
			body: I18nUpsertDto,
			beforeHandle: permissionCheck(PERMISSION.I18N_UPDATE),
			detail: {
				...DOC_DETAIL.I18N_UPSERT,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Null()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.I18N.DEL,
		async ({ body: { ids } }) => {
			await db.i18n.deleteMany({
				where: { id: { in: ids } },
			})
			return castToRes(null)
		},
		{
			body: IdsDto,
			beforeHandle: permissionCheck(PERMISSION.I18N_DELETE),
			detail: {
				...DOC_DETAIL.I18N_DEL,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Null()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.I18N.IMPORT,
		async ({ body }) => castToRes(await i18nService.import(body.file)),
		{
			beforeHandle: permissionCheck(PERMISSION.I18N_UPDATE),
			body: t.Object({
				file: t.File({ format: 'application/vnd.ms-excel' }),
			}),
			detail: DOC_DETAIL.I18N_IMPORT,
			response: {
				200: ResWrapper(t.Void()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.get(
		ROUTER.I18N.EXPORT,
		async () => {
			const buffer = await i18nService.export()
			const res = new Response(buffer)
			res.headers.set('Content-Type', 'application/vnd.ms-excel')
			res.headers.set(
				'Content-Disposition',
				`attachment; filename="translations_${new Date().getTime()}.xlsx"`,
			)
			return res
		},
		{
			beforeHandle: permissionCheck(PERMISSION.I18N_VIEW),
			detail: {
				...DOC_DETAIL.I18N_EXPORT,
				responses: {
					200: {
						description: 'File stream',
						content: { 'application/vnd.ms-excel': {} },
					},
				},
			},
			response: {
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
