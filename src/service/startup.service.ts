import {
	ADMIN_USERNAME,
	ADMIN_USER_ID,
	PERMISSIONS,
	PREFIX,
	SETTING,
	SYS_USERNAME,
	SYS_USER_ID,
	defaultRoles,
	defaultSettings,
	sequential,
	token12,
} from '../common'
import { db, env } from '../config'
import { passwordService } from './auth-util.service'

export const startupService = {
	async seed(): Promise<void> {
		await startupService.seedRoles()
		await startupService.seedPermissions()
		await startupService.seedUsers()
		await startupService.seedSettings()
	},

	async seedRoles(): Promise<void> {
		await sequential(
			Object.values(defaultRoles),
			async role =>
				await db.role.upsert({
					where: { title: role.title },
					create: role,
					update: {
						description: role.description,
						id: role.id,
					},
					select: { id: true },
				}),
		)
	},

	async seedSettings(): Promise<void> {
		await sequential(Object.values(SETTING), async key => {
			await db.setting.upsert({
				where: { key },
				create: {
					id: token12(PREFIX.SETTING),
					key,
					...defaultSettings[key],
				},
				update: {},
				select: { id: true },
			})
		})
	},

	async seedPermissions(): Promise<void> {
		const perms: Record<
			string,
			Record<string, { roles: string[]; description?: string }>
		> = PERMISSIONS
		await sequential(Object.keys(perms), async category => {
			await sequential(Object.keys(perms[category]), async action => {
				const per = perms[category][action]
				await db.permission.upsert({
					where: { title: `${category}.${action}` },
					create: {
						id: token12(PREFIX.PERMISSION),
						title: `${category}.${action}`,
						description: per.description,
						roles: {
							createMany: {
								skipDuplicates: true,
								data: per.roles.map((roleId: string) => ({
									id: token12(),
									roleId,
								})),
							},
						},
					},
					update: {
						description: per.description,
						roles: {
							createMany: {
								skipDuplicates: true,
								data: per.roles.map((roleId: string) => ({
									id: token12(),
									roleId,
								})),
							},
						},
					},
					select: { id: true },
				})
			})
		})
	},

	async seedUsers(): Promise<void> {
		// Upsert system user
		const sysPassword = await passwordService.createPassword(
			env.SYSTEM_PASSWORD,
		)
		await db.user.upsert({
			where: { username: SYS_USERNAME },
			create: {
				id: SYS_USER_ID,
				username: SYS_USERNAME,
				...sysPassword,
			},
			update: {
				id: SYS_USER_ID,
				...sysPassword,
			},
			select: { id: true },
		})

		// Upsert admin user
		const adminPassword = await passwordService.createPassword(
			env.ADMIN_PASSWORD,
		)
		await db.user.upsert({
			where: { username: ADMIN_USERNAME },
			create: {
				id: ADMIN_USER_ID,
				username: ADMIN_USERNAME,
				...adminPassword,
				roles: {
					create: {
						roleId: defaultRoles.administrator.id,
						id: token12(),
					},
				},
			},
			update: {
				id: ADMIN_USER_ID,
				...adminPassword,
				roles: {
					createMany: {
						data: [
							{
								roleId: defaultRoles.administrator.id,
								id: token12(),
							},
						],
						skipDuplicates: true,
					},
				},
			},
			select: { id: true },
		})
	},
}
