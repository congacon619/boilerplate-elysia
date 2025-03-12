import { SETTING_DATA_TYPE } from '@prisma/client'
import dayjs from 'dayjs'
import { PERMISSION, PREFIX, ROLE_NAME, SETTING, token12 } from '../../common'
import { db, env, logger } from '../../config'
import { passwordService } from '../user/service'

export const startupService = {
	async initRoleAndUser(): Promise<void> {
		try {
			const { passwordCreated, passwordExpired, passwordHash } =
				await passwordService.createPassword(env.SYSTEM_PASSWORD)

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

	async initSettings(): Promise<void> {
		try {
			await db.setting.deleteMany({
				where: { key: { notIn: Object.values(SETTING) } },
			})

			await db.setting.createMany({
				data: [
					{
						id: token12(PREFIX.SETTING),
						key: SETTING.MAINTENANCE_END_DATE,
						value: dayjs().subtract(1, 'years').toISOString(),
						type: SETTING_DATA_TYPE.DATE,
					},
					{
						id: token12(PREFIX.SETTING),
						key: SETTING.ENB_PASSWORD_ATTEMPT,
						value: 'false',
						type: SETTING_DATA_TYPE.BOOLEAN,
					},
					{
						id: token12(PREFIX.SETTING),
						key: SETTING.ENB_PASSWORD_EXPIRED,
						value: 'false',
						type: SETTING_DATA_TYPE.BOOLEAN,
					},
					{
						id: token12(PREFIX.SETTING),
						key: SETTING.ENB_JWT_PAYLOAD_ENCRYPT,
						value: 'false',
						type: SETTING_DATA_TYPE.BOOLEAN,
					},
					{
						id: token12(PREFIX.SETTING),
						key: SETTING.ENB_MFA_REQUIRED,
						value: 'false',
						type: SETTING_DATA_TYPE.BOOLEAN,
					},
					{
						id: token12(PREFIX.SETTING),
						key: SETTING.ENB_IP_WHITELIST,
						value: 'true',
						type: SETTING_DATA_TYPE.BOOLEAN,
					},
					{
						id: token12(PREFIX.SETTING),
						key: SETTING.ENB_ONLY_ONE_SESSION,
						value: 'false',
						type: SETTING_DATA_TYPE.BOOLEAN,
					},
				],
				skipDuplicates: true,
			})
			logger.info('Init default settings successfully!')
		} catch (e) {
			logger.error('Init settings failed!')
			logger.error(e)
		}
	},
}
