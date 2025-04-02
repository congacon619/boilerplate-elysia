import { Elysia, t } from 'elysia'
import { createMathExpr } from 'svg-captcha'
import { DOC_DETAIL, DOC_OPTIONS, ROUTER, ResWrapper, token16 } from '../common'
import { captchaCache, castToRes } from '../config'
import { captchaService } from '../service'
import { GenerateCaptchaDto, VerifyCaptchaDto } from './dto'

export const captchaController = new Elysia({
	name: 'CaptchaController',
	detail: { tags: [DOC_OPTIONS.tags.captcha.name] },
	prefix: ROUTER.CAPTCHA.ROOT,
})
	.get(
		'/',
		async () => {
			const { data: imageData, text: captchaText } = createMathExpr({
				color: true,
				mathMax: 29,
				mathMin: 11,
				noise: 0,
			})

			const token = token16()
			await captchaCache.set(token, captchaText)

			return castToRes({
				token,
				imageUrl: `data:image/svg+xml;base64,${Buffer.from(imageData).toString('base64')}`,
			})
		},
		{
			detail: DOC_DETAIL.CAPTCHA_GENERATE,
			response: { 200: ResWrapper(GenerateCaptchaDto) },
		},
	)
	.post(
		ROUTER.CAPTCHA.VERIFY,
		async ({ body }) => castToRes(await captchaService.validateCaptcha(body)),
		{
			body: VerifyCaptchaDto,
			detail: DOC_DETAIL.CAPTCHA_GENERATE,
			response: { 200: ResWrapper(t.Boolean()) },
		},
	)
