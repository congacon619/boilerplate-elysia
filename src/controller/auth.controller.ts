import dayjs from 'dayjs'
import { Elysia, t } from 'elysia'
import { seconds } from 'itty-time'
import { compact } from 'lodash'
import {
	ACTIVITY_TYPE,
	BadReqErr,
	DOC_DETAIL,
	DOC_OPTIONS,
	ErrorResDto,
	ITokenPayload,
	LOGIN_RES_TYPE,
	LOGIN_WITH,
	MFA_METHOD,
	NotFoundErr,
	PREFIX,
	ROUTER,
	ResWrapper,
	UnAuthErr,
	authErrors,
	isExpired,
	token12,
	token16,
	userResSelect,
} from '../common'
import {
	castToRes,
	changePasswordCache,
	db,
	env,
	loginCache,
	reqMeta,
} from '../config'
import {
	activityService,
	authCheck,
	mfaUtilService,
	passwordService,
	sessionService,
	settingService,
	tokenService,
	userUtilService,
} from '../service'
import {
	ChangePasswordConfirm,
	ChangePasswordDto,
	ChangePasswordResDto,
	LoginConfirmReqDto,
	LoginDto,
	LoginMFASetupResDto,
	LoginResDto,
	LoginResponseDto,
	RefreshTokenDto,
	UserResDto,
} from './dto'

export const authController = new Elysia({
	name: 'AuthController',
	detail: { tags: [DOC_OPTIONS.tags.auth.name] },
})
	.use(reqMeta)
	.post(
		ROUTER.AUTH.LOGIN,
		async ({ body: { username, password }, clientIp, userAgent }) => {
			const user = await db.user.findUnique({
				where: { username },
				include: { roles: true },
			})
			if (!user) {
				throw new NotFoundErr('exception.user-not-found')
			}

			const { enbAttempt, enbExpired } = await settingService.password()
			if (enbAttempt && user.passwordAttempt >= env.PASSWORD_MAX_ATTEMPT) {
				throw new BadReqErr('exception.password-max-attempt')
			}

			const match = await passwordService.comparePassword(
				password,
				user.password,
			)
			if (!match) {
				await passwordService.increasePasswordAttempt(user.id)
				throw new BadReqErr('exception.password-not-match')
			}

			if (!user.enabled) {
				throw new BadReqErr('exception.user-not-active')
			}

			if (enbExpired && new Date() > new Date(user.passwordExpired)) {
				throw new BadReqErr('exception.password-expired')
			}

			if (user.mfaTelegramEnabled || user.mfaTotpEnabled) {
				const loginToken = token16()
				await loginCache.set(loginToken, { userId: user.id })
				const mfaToken = await mfaUtilService.createSession({
					method: MFA_METHOD.TOTP,
					user,
					referenceToken: loginToken,
				})
				return castToRes({
					type: LOGIN_RES_TYPE.MFA_CONFIRM,
					token: loginToken,
					mfaToken,
					availableMethods: compact([
						user.mfaTelegramEnabled ? MFA_METHOD.TELEGRAM : undefined,
						user.mfaTotpEnabled ? MFA_METHOD.TOTP : undefined,
					]),
				})
			}

			if (await settingService.enbMFARequired()) {
				const { totpSecret, mfaToken } = await mfaUtilService.setupMfa(user.id)
				return castToRes({
					type: LOGIN_RES_TYPE.MFA_SETUP,
					totpSecret,
					mfaToken,
				})
			}

			return castToRes(
				await userUtilService.completeLogin(user, clientIp, userAgent),
			)
		},
		{
			body: LoginDto,
			detail: DOC_DETAIL.LOGIN,
			response: {
				200: ResWrapper(LoginResponseDto),
				400: ErrorResDto,
				404: ErrorResDto,
				500: ErrorResDto,
			},
		},
	)
	.post(
		ROUTER.AUTH.LOGIN_CONFIRM,
		async ({ body: { token, mfaToken, otp }, clientIp, userAgent }) => {
			const login = await loginCache.get(token)
			if (!token || !login) {
				throw new BadReqErr('exception.session-expired')
			}

			const user = await db.user.findUnique({
				where: { id: login.userId },
				include: { roles: true },
			})
			if (!user || !user.enabled) {
				throw new BadReqErr('exception.user-not-active')
			}
			if (
				!(await mfaUtilService.verifySession({
					mfaToken,
					otp,
					user,
					referenceToken: token,
				}))
			) {
				throw new BadReqErr('exception.invalid-otp')
			}

			return castToRes(
				await userUtilService.completeLogin(user, clientIp, userAgent),
			)
		},
		{
			body: LoginConfirmReqDto,
			detail: DOC_DETAIL.LOGIN_CONFIRM,
			response: {
				200: ResWrapper(LoginResDto),
				400: ErrorResDto,
				404: ErrorResDto,
				500: ErrorResDto,
			},
		},
	)
	.post(
		ROUTER.AUTH.REGISTER,
		async ({ body: { username, password } }) => {
			const existingUser = await db.user.findFirst({
				where: { username },
				select: { id: true },
			})
			if (existingUser) {
				throw new BadReqErr('exception.user-existed')
			}
			await db.user.create({
				data: {
					id: token12(PREFIX.USER),
					username,
					...(await passwordService.createPassword(password)),
					enabled: false,
				},
				select: { id: true },
			})
			return castToRes(null)
		},
		{
			body: LoginDto,
			detail: DOC_DETAIL.REGISTER,
			response: {
				200: ResWrapper(t.Null()),
				400: ErrorResDto,
				404: ErrorResDto,
				500: ErrorResDto,
			},
		},
	)
	.use(authCheck)
	.post(
		ROUTER.AUTH.LOGOUT,
		async ({ clientIp, currentUser, userAgent }) => {
			await Promise.all([
				activityService.create(
					ACTIVITY_TYPE.LOGOUT,
					{},
					{ clientIp, currentUser, userAgent },
				),
				sessionService.revoke(currentUser.id, [currentUser.sessionId]),
			])
			return castToRes(null)
		},
		{
			detail: {
				...DOC_DETAIL.LOGOUT,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Null()),
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.AUTH.REFRESH_TOKEN,
		async ({ clientIp, userAgent, body: { token } }) => {
			const session = await db.session.findFirst({
				where: { token },
				select: {
					revoked: true,
					id: true,
					expired: true,
					createdBy: { select: userResSelect },
				},
			})

			if (
				!session ||
				session.revoked ||
				isExpired(session.expired, seconds(env.EXPIRED_TOLERANCE)) ||
				!session.createdBy.enabled
			) {
				throw new UnAuthErr('exception.expired-token')
			}

			if (
				!session.createdBy.mfaTelegramEnabled &&
				!session.createdBy.mfaTotpEnabled
			) {
				if (await settingService.enbMFARequired()) {
					const { totpSecret, mfaToken } = await mfaUtilService.setupMfa(
						session.createdBy.id,
					)
					return castToRes({
						type: LOGIN_RES_TYPE.MFA_SETUP as const,
						totpSecret,
						mfaToken,
					})
				}
			}

			const payload: ITokenPayload = {
				userId: session.createdBy.id,
				loginDate: new Date(),
				loginWith: LOGIN_WITH.LOCAL,
				sessionId: session.id,
				clientIp,
				userAgent,
			}

			const { accessToken, expirationTime } =
				await tokenService.createAccessToken(payload)

			const user = {
				id: session.createdBy.id,
				mfaTelegramEnabled: session.createdBy.mfaTelegramEnabled,
				mfaTotpEnabled: session.createdBy.mfaTotpEnabled,
				telegramUsername: session.createdBy.telegramUsername,
				enabled: session.createdBy.enabled,
				created: session.createdBy.created,
				username: session.createdBy.username,
				modified: session.createdBy.modified,
				permissions: await userUtilService.getPermissions(session.createdBy),
			}

			return castToRes({
				type: LOGIN_RES_TYPE.COMPLETED,
				accessToken,
				refreshToken: token,
				exp: expirationTime.getTime(),
				expired: dayjs(expirationTime).format(),
				user,
			})
		},
		{
			body: RefreshTokenDto,
			detail: {
				...DOC_DETAIL.REFRESH_TOKEN,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Union([LoginResDto, LoginMFASetupResDto])),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.get(
		ROUTER.AUTH.CURRENT_USER,
		({ currentUser }) =>
			castToRes({
				id: currentUser.id,
				mfaTelegramEnabled: currentUser.mfaTelegramEnabled,
				mfaTotpEnabled: currentUser.mfaTotpEnabled,
				telegramUsername: currentUser.telegramUsername,
				enabled: currentUser.enabled,
				created: currentUser.created,
				username: currentUser.username,
				modified: currentUser.modified,
				permissions: currentUser.permissions,
			}),
		{
			detail: {
				...DOC_DETAIL.CURRENT_USER,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(UserResDto),
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.AUTH.CHANGE_PASSWORD,
		async ({ body: { oldPassword, method }, currentUser }) => {
			const user = await db.user.findUnique({
				where: { id: currentUser.id },
				select: {
					id: true,
					password: true,
					username: true,
					mfaTelegramEnabled: true,
					mfaTotpEnabled: true,
					totpSecret: true,
					telegramUsername: true,
				},
			})

			if (!user) {
				throw new NotFoundErr('exception.user-not-found')
			}

			if (
				!(await passwordService.comparePassword(oldPassword, user.password))
			) {
				throw new BadReqErr('exception.password-not-match')
			}

			if (!method && (user.mfaTelegramEnabled || user.mfaTotpEnabled)) {
				throw new BadReqErr('exception.mfa-required')
			}

			const token = token16()
			await changePasswordCache.set(token, { userId: currentUser.id })

			if (method) {
				const mfaToken = await mfaUtilService.createSession({
					method,
					user,
					referenceToken: token,
				})
				return castToRes({ token, mfaToken })
			}

			return castToRes({ token })
		},
		{
			body: ChangePasswordDto,
			detail: {
				...DOC_DETAIL.CHANGE_PASSWORD,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(ChangePasswordResDto),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.AUTH.CHANGE_PASSWORD_CONFIRM,
		async ({
			clientIp,
			userAgent,
			body: { token, mfaToken, otp, newPassword },
			currentUser,
		}) => {
			const cache = await changePasswordCache.get(token)
			if (!cache) {
				throw new UnAuthErr('exception.session-expired')
			}
			if (cache.userId !== currentUser.id) {
				throw new UnAuthErr('exception.session-expired')
			}

			const user = await db.user.findUnique({
				where: { id: currentUser.id },
				select: {
					id: true,
					password: true,
					username: true,
					mfaTelegramEnabled: true,
					mfaTotpEnabled: true,
					totpSecret: true,
					telegramUsername: true,
				},
			})

			if (!user) {
				throw new NotFoundErr('exception.user-not-found')
			}

			if (mfaToken && otp) {
				const isOtpValid = await mfaUtilService.verifySession({
					mfaToken,
					otp,
					user,
					referenceToken: token,
				})
				if (!isOtpValid) {
					throw new BadReqErr('exception.invalid-otp')
				}
			} else if (user.mfaTelegramEnabled || user.mfaTotpEnabled) {
				throw new BadReqErr('exception.mfa-required')
			}

			await db.$transaction([
				db.user.update({
					where: { id: currentUser.id },
					data: await passwordService.createPassword(newPassword),
					select: { id: true },
				}),
				activityService.create(
					ACTIVITY_TYPE.CHANGE_PASSWORD,
					{},
					{ currentUser, clientIp, userAgent },
				),
			])

			await sessionService.revoke(currentUser.id)
			return castToRes(null)
		},
		{
			body: ChangePasswordConfirm,
			detail: {
				...DOC_DETAIL.CHANGE_PASSWORD_CONFIRM,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Null()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
