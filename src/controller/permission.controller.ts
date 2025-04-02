import { Prisma } from '@prisma/client'
import { Elysia, t } from 'elysia'
import { DOC_DETAIL, DOC_OPTIONS, ROUTER, ResWrapper } from '../common'
import { castToRes, db } from '../config'

export const permissionController = new Elysia({
	name: 'PermissionController',
	detail: { tags: [DOC_OPTIONS.tags.permission.name] },
	prefix: ROUTER.PERMISSION.ROOT,
}).get(
	'/',
	async ({ query: { roleId } }) => {
		const where: Prisma.PermissionWhereInput = roleId
			? { roles: { some: { roleId } } }
			: {}
		return castToRes(
			await db.permission.findMany({
				where,
				orderBy: { title: 'desc' },
			}),
		)
	},
	{
		query: t.Object({ roleId: t.Optional(t.String()) }),
		detail: DOC_DETAIL.PERMISSION_GET_ALL,
		response: {
			200: ResWrapper(
				t.Array(
					t.Object({
						id: t.String(),
						description: t.Nullable(t.String()),
						title: t.String(),
					}),
				),
			),
		},
	},
)
