import dayjs from 'dayjs'
import { aes256Encrypt, seconds } from '../../../common'
import { db, env } from '../../../config'
import { IAuthPassword, ITokenPayload } from '../type'

export const passwordService = {
	async createPassword(password: string): Promise<IAuthPassword> {
		const passwordWithPepper = password + env.PASSWORD_PEPPER
		const passwordHash = await Bun.password.hash(passwordWithPepper)
		const passwordExpired = dayjs()
			.add(seconds(env.PASSWORD_EXPIRED), 's')
			.toDate()
		const passwordCreated = new Date()

		return {
			passwordHash,
			passwordExpired,
			passwordCreated,
		}
	},

	async increasePasswordAttempt(id: string): Promise<void> {
		await db.user.update({
			where: { id },
			data: { passwordAttempt: { increment: 1 } },
			select: { id: true },
		})
	},

	async comparePassword(
		password: string,
		passwordHash: string,
	): Promise<boolean> {
		const passwordWithPepper = password + env.PASSWORD_PEPPER
		return await Bun.password.verify(passwordWithPepper, passwordHash)
	},
}

export const tokenService = {
	async createRefreshToken(payload: ITokenPayload): Promise<{
		refreshToken: string
		expirationTime: Date
	}> {
		const expiredAt = dayjs()
			.add(seconds(env.JWT_REFRESH_TOKEN_EXPIRED), 's')
			.toDate()
		return {
			refreshToken: await aes256Encrypt({
				...payload,
				expired: expiredAt.getTime(),
			}),
			expirationTime: expiredAt,
		}
	},
}
