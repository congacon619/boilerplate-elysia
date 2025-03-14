import { JWTPayload } from 'jose'
import {
	ForceReply,
	InlineKeyboardMarkup,
	ReplyKeyboardMarkup,
	ReplyKeyboardRemove,
} from 'node-telegram-bot-api'
import { IResult } from 'ua-parser-js'

export interface IReqMeta extends Record<string, unknown> {
	id: string
	timezone: string
	timestamp: number
	ua: IResult
	language: string
	ip: string
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
