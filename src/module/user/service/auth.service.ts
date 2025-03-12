import { User } from '@prisma/client'
import dayjs from 'dayjs'
import { compact, uniq } from 'lodash'
import {
	ACTIVITY_TYPE,
	BadRequestException,
	NotFoundException,
	PREFIX,
	ROLE_NAME,
	UnauthorizedException,
	isExpired,
	seconds,
	token12,
	token16,
} from '../../../common'
import { IReqMeta } from '../../../common/type'
import { db, env, loginCache } from '../../../config'
import { activityService } from '../../activity/service'
import { sessionService } from '../../session/service'
import { settingService } from '../../setting/service'
import { LOGIN_RES_TYPE, LOGIN_WITH, MFA_METHOD } from '../constant'
import {
	ILogin,
	ILoginConfirmReq,
	ILoginMFARes,
	ILoginMFASetupRes,
	ILoginRes,
	ITokenPayload,
	IUserMeta,
} from '../type'
import { passwordService, tokenService } from './auth-util.service'
import { mfaUtilService } from './mfa-util.service'

export const authService = {
	async completeLogin(user: User, meta: IReqMeta): Promise<ILoginRes> {
		if (await settingService.enbOnlyOneSession()) {
			await sessionService.revoke(user.id)
		}
		const { ip, ua } = meta
		const sessionId = token12(PREFIX.SESSION)
		const payload: ITokenPayload = {
			userId: user.id,
			loginDate: new Date(),
			loginWith: LOGIN_WITH.LOCAL,
			sessionId,
			ip,
			ua: ua.ua,
		}

		const [
			{ accessToken, expirationTime },
			{ refreshToken, expirationTime: refreshTokenExpirationTime },
		] = await Promise.all([
			tokenService.createAccessToken(payload),
			tokenService.createRefreshToken(payload),
		])

		await db.$transaction(async tx => {
			const session = await tx.session.create({
				data: {
					id: sessionId,
					device:
						ua.browser.name && ua.os.name
							? `${ua.browser.name} ${ua.browser.version} on ${ua.os.name} ${ua.os.version}`
							: ua.ua,
					ip,
					createdById: user.id,
					expired: refreshTokenExpirationTime,
					userAgent: JSON.parse(JSON.stringify(ua)),
					token: refreshToken,
				},
				select: { id: true },
			})

			await activityService.create(
				{
					type: ACTIVITY_TYPE.LOGIN,
					meta,
					user: { id: user.id, sessionId: session.id },
				},
				tx,
			)
		})

		const roleUsers = await db.roleUser.findMany({
			where: { userId: user.id },
			select: { role: { select: { permissions: true } } },
		})

		const userRes = {
			id: user.id,
			mfaTelegramEnabled: user.mfaTelegramEnabled,
			mfaTotpEnabled: user.mfaTotpEnabled,
			telegramUsername: user.telegramUsername,
			enabled: user.enabled,
			created: user.created,
			username: user.username,
			modified: user.modified,
			permissions: uniq(roleUsers.flatMap(e => e.role.permissions)),
		}

		return {
			type: LOGIN_RES_TYPE.COMPLETED,
			accessToken,
			refreshToken,
			exp: expirationTime.getTime(),
			expired: dayjs(expirationTime).format(),
			user: userRes,
		}
	},

	async login(
		{ username, password }: ILogin,
		meta: IReqMeta,
	): Promise<ILoginRes | ILoginMFASetupRes | ILoginMFARes> {
		const user = await db.user.findUnique({ where: { username } })
		if (!user) {
			throw new NotFoundException('exception.user-not-found')
		}

		const { enbAttempt, enbExpired } = await settingService.password()
		if (enbAttempt && user.passwordAttempt >= env.PASSWORD_MAX_ATTEMPT) {
			throw new BadRequestException('exception.password-max-attempt')
		}

		const match = await passwordService.comparePassword(password, user.password)
		if (!match) {
			await passwordService.increasePasswordAttempt(user.id)
			throw new BadRequestException('exception.password-not-match')
		}

		if (!user.enabled) {
			throw new BadRequestException('exception.user-not-active')
		}

		if (enbExpired && new Date() > new Date(user.passwordExpired)) {
			throw new BadRequestException('exception.password-expired')
		}

		if (user.mfaTelegramEnabled || user.mfaTotpEnabled) {
			const loginToken = token16()
			await loginCache.set(loginToken, { userId: user.id })
			const mfaToken = await mfaUtilService.createSession({
				method: MFA_METHOD.TOTP,
				user,
				referenceToken: loginToken,
			})
			return {
				type: LOGIN_RES_TYPE.MFA_CONFIRM,
				token: loginToken,
				mfaToken,
				availableMethods: compact([
					user.mfaTelegramEnabled ? MFA_METHOD.TELEGRAM : undefined,
					user.mfaTotpEnabled ? MFA_METHOD.TOTP : undefined,
				]),
			}
		}

		if (await settingService.enbMFARequired()) {
			const { totpSecret, mfaToken } = await mfaUtilService.setupMfa(user.id)
			return {
				type: LOGIN_RES_TYPE.MFA_SETUP,
				totpSecret,
				mfaToken,
			}
		}

		return authService.completeLogin(user, meta)
	},

	async loginConfirm(
		{ mfaToken, token, otp }: ILoginConfirmReq,
		meta: IReqMeta,
	): Promise<ILoginRes> {
		const login = await loginCache.get(token)
		if (!token || !login) {
			throw new BadRequestException('exception.session-expired')
		}

		const user = await db.user.findUnique({
			where: { id: login.userId },
		})
		if (!user || !user.enabled) {
			throw new BadRequestException('exception.user-not-active')
		}
		if (
			!(await mfaUtilService.verifySession({
				mfaToken,
				otp,
				user,
				referenceToken: token,
			}))
		) {
			throw new BadRequestException('exception.invalid-otp')
		}

		return authService.completeLogin(user, meta)
	},

	async logout(meta: IReqMeta, user: IUserMeta): Promise<void> {
		await Promise.all([
			activityService.create({
				type: ACTIVITY_TYPE.LOGOUT,
				meta,
				user,
			}),
			sessionService.revoke(user.id, [user.sessionId]),
		])
	},

	async register(
		{ username, password }: ILogin,
		meta: IReqMeta,
	): Promise<void> {
		const existingUser = await db.user.findFirst({
			where: { username },
			select: { id: true },
		})

		if (existingUser) {
			throw new BadRequestException('exception.user-existed')
		}
		const userRole = await db.role.findFirst({
			where: { name: ROLE_NAME.USER },
			select: { id: true },
		})
		if (!userRole) {
			throw new NotFoundException('exception.user-role-not-found')
		}
		const { passwordCreated, passwordExpired, passwordHash } =
			await passwordService.createPassword(password)

		await db.$transaction(async tx => {
			const user = await tx.user.create({
				data: {
					id: token12(PREFIX.USER),
					username,
					password: passwordHash,
					passwordCreated,
					passwordExpired,
					enabled: true,
					roleUsers: {
						create: { roleId: userRole.id, id: token12(PREFIX.ROLE_USER) },
					},
				},
				select: { id: true },
			})
			await activityService.create(
				{
					type: ACTIVITY_TYPE.REGISTER,
					meta,
					user,
					reference: { id: user.id },
				},
				tx,
			)
		})
	},

	async refreshToken(
		{ token }: { token: string },
		meta: IReqMeta,
	): Promise<ILoginRes | ILoginMFASetupRes> {
		const session = await db.session.findFirst({
			where: { token },
			select: {
				revoked: true,
				id: true,
				expired: true,
				createdBy: {
					select: {
						mfaTelegramEnabled: true,
						enabled: true,
						id: true,
						mfaTotpEnabled: true,
						telegramUsername: true,
						created: true,
						username: true,
						modified: true,
					},
				},
			},
		})

		if (
			!session ||
			session.revoked ||
			isExpired(session.expired, seconds(env.EXPIRED_TOLERANCE)) ||
			!session.createdBy.enabled
		) {
			throw new UnauthorizedException('exception.expired-token')
		}

		if (
			!session.createdBy.mfaTelegramEnabled &&
			!session.createdBy.mfaTotpEnabled
		) {
			if (await settingService.enbMFARequired()) {
				const { totpSecret, mfaToken } = await mfaUtilService.setupMfa(
					session.createdBy.id,
				)
				return {
					type: LOGIN_RES_TYPE.MFA_SETUP,
					totpSecret,
					mfaToken,
				}
			}
		}

		const payload: ITokenPayload = {
			userId: session.createdBy.id,
			loginDate: new Date(),
			loginWith: LOGIN_WITH.LOCAL,
			sessionId: session.id,
			ip: meta.ip,
			ua: meta.ua.ua,
		}

		const { accessToken, expirationTime } =
			await tokenService.createAccessToken(payload)

		const roleUsers = await db.roleUser.findMany({
			where: { userId: session.createdBy.id },
			select: { role: { select: { permissions: true } } },
		})

		const user = {
			id: session.createdBy.id,
			mfaTelegramEnabled: session.createdBy.mfaTelegramEnabled,
			mfaTotpEnabled: session.createdBy.mfaTotpEnabled,
			telegramUsername: session.createdBy.telegramUsername,
			enabled: session.createdBy.enabled,
			created: session.createdBy.created,
			username: session.createdBy.username,
			modified: session.createdBy.modified,
			permissions: uniq(roleUsers.flatMap(e => e.role.permissions)),
		}

		return {
			type: LOGIN_RES_TYPE.COMPLETED,
			accessToken,
			refreshToken: token,
			exp: expirationTime.getTime(),
			expired: dayjs(expirationTime).format(),
			user,
		}
	},
}
