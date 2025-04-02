import { captchaCache } from '../config'

export const captchaService = {
	async validateCaptcha({
		token,
		userInput,
	}: { token: string; userInput: string }): Promise<boolean> {
		const cachedText = await captchaCache.get(token)
		return cachedText !== null && cachedText === userInput
	},
}
