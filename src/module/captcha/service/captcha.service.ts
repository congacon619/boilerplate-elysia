import { createMathExpr } from 'svg-captcha'
import { token16 } from '../../../common'
import { captchaCache } from '../../../config'

export const captchaService = {
	async newSession(): Promise<{ token: string; imageUrl: string }> {
		const { data: imageData, text: captchaText } = createMathExpr({
			color: true,
			mathMax: 29,
			mathMin: 11,
			noise: 0,
		})

		const token = token16()
		await captchaCache.set(token, captchaText)

		return {
			token,
			imageUrl: `data:image/svg+xml;base64,${Buffer.from(imageData).toString('base64')}`,
		}
	},

	async validateCaptcha({
		token,
		userInput,
	}: { token: string; userInput: string }): Promise<boolean> {
		const cachedText = await captchaCache.get(token)
		return cachedText !== null && cachedText === userInput
	},
}
