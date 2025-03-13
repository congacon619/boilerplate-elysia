import { Elysia, t } from 'elysia'
import { DOC_DETAIL, DOC_OPTIONS, PERMISSION, ROUTER } from '../../../common'
import { ErrorResDto, ResWrapper, authErrors } from '../../../common/type'
import { castToRes, reqMeta } from '../../../config'
import { authCheck, permissionCheck } from '../auth.middleware'
import { mfaService } from '../service'
import {
	MfaConfirmDto,
	MfaResetConfirmDto,
	MfaResetDto,
	MfaResetResDto,
	MfaSetupDto,
	MfaSetupResDto,
} from '../type'

export const mfaController = new Elysia({
	name: 'MfaController',
	detail: { tags: [DOC_OPTIONS.tags.mfa.name] },
	prefix: ROUTER.MFA.ROOT,
})
	.use(reqMeta)
	.post(
		ROUTER.MFA.CONFIRM,
		async ({ body, metadata }) =>
			castToRes(await mfaService.setupMFAConfirm(body, metadata)),
		{
			body: MfaConfirmDto,
			detail: DOC_DETAIL.MFA_SETUP_CONFIRM,
			response: {
				200: ResWrapper(t.Void()),
				400: ErrorResDto,
				500: ErrorResDto,
			},
		},
	)
	.use(authCheck)
	.post(
		ROUTER.MFA.REQUEST,
		async ({ body, user }) =>
			castToRes(await mfaService.setupMFARequest(body, user)),
		{
			body: MfaSetupDto,
			detail: {
				...DOC_DETAIL.MFA_SETUP_REQUEST,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(MfaSetupResDto),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.MFA.RESET_REQUEST,
		async ({ body, user }) =>
			castToRes(await mfaService.createResetMFARequest(body, user)),
		{
			beforeHandle: permissionCheck(PERMISSION.USER_RESET_MFA),
			body: MfaResetDto,
			detail: {
				...DOC_DETAIL.MFA_RESET_REQUEST,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(MfaResetResDto),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
	.post(
		ROUTER.MFA.RESET_CONFIRM,
		async ({ body, user, metadata }) =>
			castToRes(await mfaService.confirmResetMFA(body, user, metadata)),
		{
			beforeHandle: permissionCheck(PERMISSION.USER_RESET_MFA),
			body: MfaResetConfirmDto,
			detail: {
				...DOC_DETAIL.MFA_RESET_CONFIRM,
				security: [{ accessToken: [] }],
			},
			response: {
				200: ResWrapper(t.Void()),
				400: ErrorResDto,
				...authErrors,
			},
		},
	)
