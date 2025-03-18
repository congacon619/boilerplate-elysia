import { t } from 'elysia'

export const VerifyCaptchaDto = t.Object({
	token: t.String({ minLength: 1 }),
	userInput: t.String({ minLength: 1 }),
})

export const GenerateCaptchaDto = t.Object({
	token: t.String(),
	imageUrl: t.String(),
})
