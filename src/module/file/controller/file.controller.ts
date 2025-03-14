import { Elysia, t } from 'elysia'
import { DOC_OPTIONS, ROUTER } from '../../../common'

export const fileController = new Elysia({
	name: 'FileController',
	detail: { tags: [DOC_OPTIONS.tags.file.name] },
	prefix: ROUTER.FILE.ROOT,
}).post(
	ROUTER.FILE.UPLOAD,
	({ body }) => {
		console.log(body.file.arrayBuffer())
	},
	{
		body: t.Object({
			file: t.File({ format: 'image/*' }),
		}),
	},
)
