import { PERMISSION } from '../../../common'
import { LOGIN_WITH } from '../constant'

export interface ITokenPayload {
	userId: string
	loginDate: Date
	loginWith: LOGIN_WITH
	sessionId: string
	ip: string
	ua: string
}

export interface IAccessTokenRes {
	accessToken: string
	expirationTime: Date
}

export interface IAuthPassword {
	passwordHash: string
	passwordExpired: Date
	passwordCreated: Date
}

export type PermissionType =
	| PERMISSION
	| { and: PERMISSION[] }
	| { or: PERMISSION[] }
	| { not: PERMISSION }
