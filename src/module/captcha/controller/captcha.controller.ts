import { Elysia, t } from 'elysia'
import { DOC_DETAIL, DOC_OPTIONS, ROUTER, ResWrapper } from '../../../common'
import { castToRes } from '../../../config'
import { captchaService } from '../service'
import { GenerateCaptchaDto, VerifyCaptchaDto } from '../type'

export const captchaController = new Elysia({
	name: 'CaptchaController',
	detail: { tags: [DOC_OPTIONS.tags.captcha.name] },
	prefix: ROUTER.CAPTCHA.ROOT,
})
	.get('/', async () => castToRes(await captchaService.newSession()), {
		detail: DOC_DETAIL.CAPTCHA_GENERATE,
		response: { 200: ResWrapper(GenerateCaptchaDto) },
	})
	.post(
		ROUTER.CAPTCHA.VERIFY,
		async ({ body }) => castToRes(await captchaService.validateCaptcha(body)),
		{
			body: VerifyCaptchaDto,
			detail: DOC_DETAIL.CAPTCHA_GENERATE,
			response: { 200: ResWrapper(t.Boolean()) },
		},
	)
