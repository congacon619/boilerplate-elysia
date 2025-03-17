import { env, resend } from '../../config'
import OTPEmail from '../../emails/otp'

export const emailService = {
	async sendOtpEmail(email: string, otp: string) {
		await resend.emails.send({
			from: env.SEND_FROM_EMAIL,
			to: email,
			subject: 'Verify your email address',
			react: <OTPEmail otp={otp} />,
		})
	},
}
