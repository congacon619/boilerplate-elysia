import dayjs from 'dayjs'
import { seconds } from '../../../common'
import { env } from '../../../config'
import { IAuthPassword } from '../type'

export const authUtilService = {
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
}
