import { PERMISSION, PREFIX, ROLE_NAME, token12 } from '../../common'
import { db, env, logger } from '../../config'
import { authUtilService } from '../user/service'

export const startupService = {
	async initRoleAndUser(): Promise<void> {
		try {
			const { passwordCreated, passwordExpired, passwordHash } =
				await authUtilService.createPassword(env.SYSTEM_PASSWORD)

			await db.$transaction(async tx => {
				const { id: roleId } = await tx.role.upsert({
					where: { name: ROLE_NAME.SYSTEM },
					update: { permissions: Object.values(PERMISSION), protected: true },
					create: {
						id: token12(PREFIX.ROLE),
						name: ROLE_NAME.SYSTEM,
						permissions: Object.values(PERMISSION),
						protected: true,
					},
					select: { id: true },
				})
				const { id: userId } = await tx.user.upsert({
					where: { username: env.SYSTEM_USERNAME },
					update: {
						password: passwordHash,
						protected: true,
						enabled: true,
						passwordCreated,
						passwordExpired,
						passwordAttempt: 0,
					},
					create: {
						id: token12(PREFIX.USER),
						username: env.SYSTEM_USERNAME,
						password: passwordHash,
						protected: true,
						enabled: true,
						passwordCreated,
						passwordExpired,
					},
					select: { id: true },
				})
				await tx.roleUser.upsert({
					where: { roleId_userId: { roleId, userId } },
					update: { roleId, userId },
					create: { roleId, userId, id: token12(PREFIX.ROLE_USER) },
				})

				const userPermissions = [
					PERMISSION.ACTIVITY_VIEW,
					PERMISSION.SESSION_VIEW,
					PERMISSION.SESSION_REVOKE,
					PERMISSION.I18N_VIEW,
					PERMISSION.SETTING_VIEW,
					PERMISSION.IP_WHITELIST_VIEW,
					PERMISSION.FILE_UPLOAD,
				]
				await tx.role.upsert({
					where: { name: ROLE_NAME.USER },
					update: { permissions: userPermissions, protected: true },
					create: {
						id: token12(PREFIX.ROLE),
						name: ROLE_NAME.USER,
						permissions: userPermissions,
						protected: true,
					},
					select: { id: true },
				})
			})
			logger.info('Init default user and role successfully!')
		} catch (e) {
			logger.error('Init default user and role failed!')
			logger.error(e)
		}
	},
}
