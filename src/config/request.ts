import { Elysia } from 'elysia'
import { UAParser } from 'ua-parser-js'
import { DEFAULT_LANGUAGE, LANG, token12 } from '../common'
import { IPHeaders, IReqMeta } from '../common/type'

export const headersToCheck: IPHeaders[] = [
	'x-real-ip', // Nginx proxy/FastCGI
	'x-client-ip', // Apache https://httpd.apache.org/docs/2.4/mod/mod_remoteip.html#page-header
	'cf-connecting-ip', // Cloudflare
	'fastly-client-ip', // Fastly
	'x-cluster-client-ip', // GCP
	'x-forwarded', // General Forwarded
	'forwarded-for', // RFC 7239
	'forwarded', // RFC 7239
	'appengine-user-ip', // GCP
	'true-client-ip', // Akamai and Cloudflare
	'cf-pseudo-ipv4', // Cloudflare
	'fly-client-ip', // Fly.io
]

export const getIP = (
	headers: Headers,
	checkHeaders: IPHeaders[] = headersToCheck,
): string => {
	// check for x-forwaded-for only when user did not provide headers
	const xForwardedFor = headers.get('x-forwarded-for')
	if (xForwardedFor && checkHeaders === headersToCheck) {
		return xForwardedFor.split(',')[0].trim()
	}

	for (const header of checkHeaders) {
		const clientIP = headers.get(header)
		if (clientIP) {
			return clientIP.trim()
		}
	}
	return ''
}

export const reqMeta = (app: Elysia) =>
	app.derive({ as: 'local' }, ({ request, set }) => {
		const headers = request.headers

		const requestId = headers.get('x-request-id') ?? token12()
		const timezone =
			headers.get('x-timezone') ??
			Intl.DateTimeFormat().resolvedOptions().timeZone
		const timestamp = Number.parseInt(
			headers.get('x-timestamp') ?? `${Date.now()}`,
			10,
		)
		const requestLanguage = headers.get('accept-language') ?? ''
		const language = Object.values(LANG).includes(requestLanguage as LANG)
			? requestLanguage
			: DEFAULT_LANGUAGE
		const ua = new UAParser(headers.get('user-agent') ?? '').getResult()

		if (!headers.has('x-request-id')) set.headers['x-request-id'] = requestId
		if (!headers.has('x-timezone')) set.headers['x-timezone'] = timezone
		if (!headers.has('x-timestamp'))
			set.headers['x-timestamp'] = timestamp.toString()
		if (!headers.has('accept-language'))
			set.headers['accept-language'] = language

		return {
			metadata: {
				id: requestId,
				timezone,
				timestamp,
				language,
				ua,
				ip: getIP(headers),
			} satisfies IReqMeta,
		}
	})

export const nocache = (app: Elysia) => {
	return app.onRequest(({ set }) => {
		set.headers['Surrogate-Control'] = 'no-store'
		set.headers['Cache-Control'] =
			'no-store, no-cache, must-revalidate, proxy-revalidate'
		// Deprecated though https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Pragma
		set.headers.Pragma = 'no-cache'
		set.headers.Expires = '0'
	})
}
