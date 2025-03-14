import { Prisma } from '@prisma/client'
import { Value } from '@sinclair/typebox/value'
import XLSX from 'xlsx'
import {
	AppException,
	BadRequestException,
	HTTP_STATUS,
	PREFIX,
	token12,
} from '../../../common'
import { db } from '../../../config'
import {
	I18NImport,
	I18NImportDto,
	II18nPagination,
	II18nUpsert,
	IPaginateI18nRes,
} from '../type'

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

	async export(): Promise<Buffer> {
		const translations = await db.i18n.findMany()
		const keys = ['KEY', 'EN', 'ZH', 'KR', 'VI']
		const data = translations.map(translation => [
			translation.key,
			translation.en,
			translation.zh,
			translation.ko,
			translation.vi,
		])
		const worksheet = XLSX.utils.aoa_to_sheet([keys, ...data])
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'i18n')
		worksheet['!cols'] = keys.map(() => ({ wch: 20 }))
		return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
	},

	async import(file: File): Promise<void> {
		const workbook = XLSX.read(await file.arrayBuffer(), { type: 'buffer' })
		const sheetName = workbook.SheetNames[0]
		if (!sheetName) {
			throw new AppException('exception.import-data-invalid')
		}
		const worksheet = workbook.Sheets[sheetName]
		const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
		if (data.length <= 1) {
			throw new AppException('exception.import-data-invalid')
		}

		const headers = data[0]
		const validatedData: I18NImport[] = []

		for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
			const row = data[rowIndex]
			const rowObject: Record<string, string> = {}

			for (let colIndex = 0; colIndex < headers.length; colIndex++) {
				rowObject[headers[colIndex]] = String(row[colIndex] || '')
			}
			const result = Value.Check(I18NImportDto, rowObject)
			if (!result) {
				throw new BadRequestException('exception.import-data-invalid')
			}

			validatedData.push(rowObject as I18NImport)
		}

		if (validatedData.length === 0) {
			throw new AppException('exception.import-data-invalid')
		}

		await db.$transaction([
			db.i18n.deleteMany(),
			db.i18n.createMany({
				data: validatedData.map(data => ({
					id: token12(PREFIX.I18N),
					key: data.KEY,
					en: data.EN,
					zh: data.ZH,
					ko: data.KR,
					vi: data.VI,
				})),
				skipDuplicates: true,
			}),
		])
	},
}
