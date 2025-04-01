import {
	IUserMeta,
	NotFoundException,
	PERMISSION,
	UnauthorizedException,
} from '../common'

export const apiKeyService = {
	validatePermission(apiKey: { userId: string } | null, user: IUserMeta): void {
		if (!apiKey) {
			throw new NotFoundException('exception.api-key-not-found')
		}
		if (
			apiKey.userId !== user.id &&
			!user.permissions.includes(PERMISSION.API_KEY_UPDATE_ALL)
		) {
			throw new UnauthorizedException('exception.forbidden')
		}
	},
}
