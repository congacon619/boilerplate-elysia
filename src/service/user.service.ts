import { IReqMeta } from '../../../common'
import { IUserMeta, IUserUpsert } from '../type'

export const userService = {
	async upsert(
		{ id, username, password, enabled, roleIds }: IUserUpsert,
		user: IUserMeta,
		meta: IReqMeta,
	): Promise<void> {},
}
