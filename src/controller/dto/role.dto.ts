import { t } from 'elysia'

export const UpsertRoleDto = t.Object({
	id: t.Optional(t.String()),
	enabled: t.Boolean({ default: true }),
	title: t.String({ minLength: 3 }),
	description: t.Nullable(t.Optional(t.String())),
	permissionIds: t.Array(t.String(), { minItems: 1 }),
	playerIds: t.Array(t.String(), { minItems: 0 }),
})

export const PaginateRoleResDto = t.Array(
	t.Intersect([
		t.Omit(UpsertRoleDto, ['enabled']),
		t.Object({
			id: t.String(),
			permissionIds: t.Array(t.String()),
			playerIds: t.Array(t.String()),
		}),
	]),
)

export const RolePaginationDto = t.Object({
	userId: t.Optional(t.String()),
})
