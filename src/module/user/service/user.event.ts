import { currentUserCache, userEmitter } from '../../../config'

userEmitter.on(
	'userUpdated',
	async ({ id }) => await currentUserCache.delete(id),
)
