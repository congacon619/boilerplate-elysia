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
