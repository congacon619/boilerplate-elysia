import { t } from 'elysia'

export const CreateIpWhitelistDto = t.Object({
	ip: t.String({ minLength: 1 }),
	note: t.Optional(t.String()),
})
export type ICreateIpWhitelist = typeof CreateIpWhitelistDto.static

export const IpWhitelistDto = t.Array(
	t.Object({
		id: t.String(),
		ip: t.String(),
		note: t.Nullable(t.String()),
	}),
)
