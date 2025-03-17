import { Static, Type as t } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { Value } from '@sinclair/typebox/value'
import {
	APP_ENV,
	CORS_ALLOW_HEADERS,
	LOG_LEVEL,
	REGEX_HTTP_METHOD,
	REGEX_TIME,
} from '../common'

export const envSchema = t.Object({
	APP_ENV: t.Enum(APP_ENV, { default: APP_ENV.DEV }),
	APP_NAME: t.String({ minLength: 1 }),
	PORT: t.Number({ minimum: 0, maximum: 65535, default: 3000 }),

	API_PREFIX: t.String({ default: 'api' }),

	COMMIT_HASH: t.String(),
	BUILD_DATE: t.Integer(),
	BUILD_NUMBER: t.String(),

	POSTGRESQL_URI: t.String(),

	STATIC_MAX_AGE: t.Integer({ default: 86400 }),
	STATIC_PATH: t.String({ default: '/public' }),

	REDIS_URI: t.String(),
	REDIS_PASSWORD: t.Optional(t.String()),

	CORS_ALLOW_METHOD: t.Optional(t.RegExp(REGEX_HTTP_METHOD)),
	CORS_ALLOW_HEADERS: t.String({ default: CORS_ALLOW_HEADERS.join(',') }),
	CORS_ALLOW_ORIGIN: t.String({ default: '*' }),

	JWT_AUDIENCE: t.String({ default: 'https://example.com' }),
	JWT_ISSUER: t.String({ default: 'admin' }),
	JWT_SUBJECT: t.String({ default: 'admin' }),

	JWT_ACCESS_TOKEN_SECRET_KEY: t.String(),
	JWT_ACCESS_TOKEN_EXPIRED: t.RegExp(REGEX_TIME, { default: '15m' }),
	JWT_ACCESS_TOKEN_NOT_BEFORE_EXPIRATION: t.RegExp(REGEX_TIME, {
		default: '0s',
	}),
	JWT_REFRESH_TOKEN_EXPIRED: t.RegExp(REGEX_TIME, { default: '15d' }),
	EXPIRED_TOLERANCE: t.RegExp(REGEX_TIME, { default: '1m' }),

	REQUEST_TIMEOUT: t.RegExp(REGEX_TIME, { default: '10s' }),

	SYSTEM_USERNAME: t.String(),
	SYSTEM_PASSWORD: t.String(),

	SALT_LENGTH: t.Integer({ minimum: 8, maximum: 20, default: 10 }),
	PASSWORD_MAX_ATTEMPT: t.Integer({ minimum: 1, maximum: 100, default: 5 }),
	PASSWORD_PEPPER: t.String(),
	PASSWORD_EXPIRED: t.RegExp(REGEX_TIME, { default: '180d' }),

	ENCRYPT_KEY: t.String(),
	ENCRYPT_IV: t.String(),

	S3_ENDPOINT: t.Optional(t.String()),
	S3_BUCKET: t.Optional(t.String()),
	S3_REGION: t.Optional(t.String()),
	S3_ACCESS_KEY: t.Optional(t.String()),
	S3_SECRET_KEY: t.Optional(t.String()),

	ENB_SWAGGER_UI: t.Boolean({ default: true }),
	SWAGGER_EP: t.String({ default: 'swagger' }),
	ENB_SWAGGER_WRITE_FILE: t.Boolean({ default: false }),

	AUTHOR_NAME: t.String({ default: 'AUTHOR_NAME' }),
	AUTHOR_URL: t.String({ default: 'https://example.com' }),
	AUTHOR_EMAIL: t.String({ default: 'example@gmail.com' }),
	LICENSE_NAME: t.String({ default: 'Apache 2.0' }),
	LICENSE_URL: t.String({
		default: 'https://www.apache.org/licenses/LICENSE-2.0',
	}),

	BULL_BOARD_EP: t.String({ default: 'queues' }),

	LOG_LEVEL: t.String({ default: LOG_LEVEL.INFO }),

	RESEND_API_KEY: t.String({ minLength: 1 }),
	SEND_FROM_EMAIL: t.String({ minLength: 1, format: 'email' }),
})

const Compiler = TypeCompiler.Compile(envSchema)
export const env = Value.Cast(envSchema, process.env) as Static<
	typeof envSchema
>

if (!Compiler.Check(env)) {
	const errors = [...Compiler.Errors(env)].reduce((errors, e) => {
		const path = e.path.substring(1)
		return { ...errors, [path]: e.message }
	}, {})
	console.error('❌ Invalid environment variables:', errors)
	process.exit(1)
}
