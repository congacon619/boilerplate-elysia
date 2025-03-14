import { Elysia, t } from 'elysia'
import { DOC_DETAIL, DOC_OPTIONS, ROUTER } from '../../../common'
import { ErrorResDto, ResWrapper } from '../../../common/type'
import { castToRes } from '../../../config'
import { storageBackend } from '../service'

export const fileController = new Elysia({
	name: 'FileController',
	detail: { tags: [DOC_OPTIONS.tags.file.name] },
	prefix: ROUTER.FILE.ROOT,
})
	.post(
		ROUTER.FILE.UPLOAD,
		async ({ body }) => {
			const url = await storageBackend.upload(body.file)
			return castToRes({ url })
		},
		{
			body: t.Object({
				file: t.File({ format: 'image/*' }),
			}),
			detail: DOC_DETAIL.FILE_UPLOAD,
			response: {
				200: ResWrapper(t.Object({ url: t.String() })),
				400: ErrorResDto,
				500: ErrorResDto,
			},
		},
	)
	.get(
		ROUTER.FILE.DOWNLOAD,
		async ({ params }) => {
			const { filename } = params
			const { content, contentType } = await storageBackend.download(filename)
			const res = new Response(content)
			res.headers.set('Content-Type', contentType.mime)
			res.headers.set(
				'Content-Disposition',
				`attachment; filename="${filename}"`,
			)
			return res
		},
		{
			params: t.Object({ filename: t.String({ minLength: 1 }) }),
			detail: {
				...DOC_DETAIL.FILE_DOWNLOAD,
				responses: {
					200: {
						description: 'File stream',
						content: {
							'application/octet-stream': {},
						},
					},
				},
			},
			response: {
				400: ErrorResDto,
				500: ErrorResDto,
			},
		},
	)
