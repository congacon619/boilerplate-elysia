import { t } from 'elysia'

export const UpsertRoleDto = t.Object({
	id: t.Optional(t.String()),
	enabled: t.Boolean({ default: true }),
	name: t.String({ minLength: 3 }),
	description: t.Nullable(t.Optional(t.String())),
	permissions: t.Array(t.String(), { minItems: 1 }),
})
export type IUpsertRole = typeof UpsertRoleDto.static

export const PaginateRoleResDto = t.Object({
	docs: t.Array(
		t.Intersect([
			UpsertRoleDto,
			t.Object({
				id: t.String(),
				protected: t.Boolean(),
			}),
		]),
	),
	count: t.Integer(),
})
export type IPaginateRoleRes = typeof PaginateRoleResDto.static
