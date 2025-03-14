import { Elysia, t } from 'elysia'
import {
	DOC_DETAIL,
	DOC_OPTIONS,
	PERMISSION,
	ROUTER,
	ResWrapper,
} from '../../../common'
import { castToRes } from '../../../config'

export const permissionController = new Elysia({
	name: 'PermissionController',
	detail: { tags: [DOC_OPTIONS.tags.permission.name] },
	prefix: ROUTER.PERMISSION.ROOT,
}).get('/', () => castToRes(Object.values(PERMISSION)), {
	detail: DOC_DETAIL.PERMISSION_GET_ALL,
	response: {
		200: ResWrapper(t.Array(t.Enum(PERMISSION))),
	},
})
