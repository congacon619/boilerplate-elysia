import { t } from 'elysia'
import { HEALTH_STATE } from '../../common'

export const HealthCheckDto = t.Object({
	status: t.Enum(HEALTH_STATE),
	details: t.Optional(t.Nullable(t.Any())),
	error: t.Optional(t.Nullable(t.Any())),
})

export const GetTimeDto = t.Object({
	t: t.Integer(),
	time: t.String(),
})

export const GetVersionDto = t.Object({
	commitHash: t.String(),
	buildDate: t.Integer(),
	buildNumber: t.String(),
})
