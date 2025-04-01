import { uniq } from 'lodash'
import { UPermission } from '../common'
import { db } from '../config'

export const permissionService = {
	async getPermissions(user: { roles: { roleId: string }[] }): Promise<
		UPermission[]
	> {
		const permissions = await db.rolePermission.findMany({
			where: { roleId: { in: user.roles.map(x => x.roleId) } },
			select: { permission: { select: { title: true } } },
		})
		return uniq(permissions.map(x => x.permission.title)) as UPermission[]
	},
}
