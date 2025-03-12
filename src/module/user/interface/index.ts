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
