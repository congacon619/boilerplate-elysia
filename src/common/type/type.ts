import { JWTPayload } from 'jose'
import {
	ForceReply,
	InlineKeyboardMarkup,
	ReplyKeyboardMarkup,
	ReplyKeyboardRemove,
} from 'node-telegram-bot-api'
import { Paths } from 'type-fest'
import { ACTIVITY_TYPE, LOGIN_WITH, MFA_METHOD, PERMISSIONS } from '../constant'

export interface IReqMeta extends Record<string, unknown> {
	id: string
	timezone: string
	timestamp: number
	userAgent: string
	language: string
	clientIp: string
}

export type IPHeaders =
	| 'x-real-ip'
	| 'x-client-ip'
	| 'cf-connecting-ip'
	| 'fastly-client-ip'
	| 'x-cluster-client-ip'
	| 'x-forwarded'
	| 'forwarded-for'
	| 'forwarded'
	| 'appengine-user-ip'
	| 'true-client-ip'
	| 'cf-pseudo-ipv4'
	| (string & {})

export type IJwtVerified = JWTPayload & { data: string }

export interface ITelegramMessage {
	chatIds: string[]
	botId?: string
	message?: string | null
	reply_markup?:
		| InlineKeyboardMarkup
		| ReplyKeyboardMarkup
		| ReplyKeyboardRemove
		| ForceReply
	photos?: string[]
	videos?: string[]
}

export interface ITokenPayload {
	userId: string
	loginDate: Date
	loginWith: LOGIN_WITH
	sessionId: string
	clientIp: string
	userAgent: string
}

export interface ActivityTypeMap extends Record<ACTIVITY_TYPE, object> {
	[ACTIVITY_TYPE.LOGIN]: Record<string, never>
	[ACTIVITY_TYPE.LOGOUT]: Record<string, never>
	[ACTIVITY_TYPE.CHANGE_PASSWORD]: Record<string, never>
	[ACTIVITY_TYPE.SETUP_MFA]: {
		method: MFA_METHOD
		telegramUsername?: string
	}

	[ACTIVITY_TYPE.DEL_ROLE]: {
		roleIds: string[]
	}
	[ACTIVITY_TYPE.CREATE_ROLE]: {
		id: string
		description: string
		title: string
		permissionIds: string[]
		playerIds: string[]
	}
	[ACTIVITY_TYPE.UPDATE_ROLE]: {
		id: string
		description: string
		title: string
		permissionIds: string[]
		playerIds: string[]
	}

	[ACTIVITY_TYPE.REVOKE_SESSION]: {
		sessionId: string
	}
	[ACTIVITY_TYPE.RESET_MFA]: {
		userIds: string[]
	}
	[ACTIVITY_TYPE.CREATE_IP_WHITELIST]: {
		ip: string
		note?: string
	}
	[ACTIVITY_TYPE.DEL_IP_WHITELIST]: {
		ips: string[]
	}
	[ACTIVITY_TYPE.UPDATE_SETTING]: {
		key: string
		value: string
	}

	[ACTIVITY_TYPE.CREATE_TELEGRAM_BOT]: {
		id: string
	}
	[ACTIVITY_TYPE.UPDATE_TELEGRAM_BOT]: {
		id: string
	}
	[ACTIVITY_TYPE.DEL_TELEGRAM_BOT]: {
		botIds: string[]
	}

	[ACTIVITY_TYPE.CREATE_USER]: {
		id: string
		enabled: boolean
		roleIds: string[]
		username: string
	}
	[ACTIVITY_TYPE.UPDATE_USER]: {
		id: string
		enabled?: boolean
		roleIds?: string[]
		username?: string
	}

	[ACTIVITY_TYPE.CREATE_API_KEY]: {
		id: string
	}
	[ACTIVITY_TYPE.UPDATE_API_KEY]: {
		id: string
	}
	[ACTIVITY_TYPE.DEL_API_KEY]: {
		apiKeyIds: string[]
	}
}

export interface IUserMeta {
	id: string
	username: string
	mfaTotpEnabled: boolean
	mfaTelegramEnabled: boolean
	telegramUsername: string | null
	enabled: boolean
	created: Date
	modified: Date
	permissions: string[]
	sessionId: string
	password: string
	totpSecret?: string | null
}

export type PermissionKey = Paths<typeof PERMISSIONS, { maxRecursionDepth: 1 }>
export type ValidPermissionKey<T> = T extends `${string}.${string}` ? T : never
export type UPermission = ValidPermissionKey<PermissionKey>
