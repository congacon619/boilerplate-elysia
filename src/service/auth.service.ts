import { IReqMeta } from '../../../common'
import { IChangePasswordConfirm, IUserMeta } from '../type'

export const authService = {
	async changePasswordConfirm(
		{ newPassword, token, mfaToken, otp }: IChangePasswordConfirm,
		reqUser: IUserMeta,
		meta: IReqMeta,
	): Promise<void> {},
}
