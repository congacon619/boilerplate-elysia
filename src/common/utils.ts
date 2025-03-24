import dayjs from 'dayjs'
import { SignJWT, jwtVerify } from 'jose'
import { customAlphabet } from 'nanoid'
import { env } from '../config'
import { IJwtVerified } from './type'

const NANO_ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
export const token12 = (prefix = ''): string => {
	const id = customAlphabet(NANO_ID_ALPHABET)(12)
	return prefix.length ? `${prefix}_${id}` : id
}

export const token16 = (prefix = ''): string => {
	const id = customAlphabet(NANO_ID_ALPHABET)(16)
	return prefix.length ? `${prefix}_${id}` : id
}

export const token32 = (prefix = ''): string => {
	const id = customAlphabet(NANO_ID_ALPHABET)(32)
	return prefix.length ? `${prefix}_${id}` : id
}

export function isExpired(
	now: Date | number,
	expiredInSeconds?: number,
): boolean {
	const targetDate = dayjs(now)
	const comparisonDate = expiredInSeconds
		? dayjs().add(expiredInSeconds, 'second')
		: dayjs()
	return comparisonDate.isAfter(targetDate)
}

// region encrypt
const algorithm = 'AES-CBC'
const getKeyAndIv = async (
	type: KeyUsage,
): Promise<{ key: CryptoKey; iv: Buffer }> => {
	const keyBuffer = Buffer.from(env.ENCRYPT_KEY, 'hex')
	const iv = Buffer.from(env.ENCRYPT_IV, 'hex')
	const key = await crypto.subtle.importKey(
		'raw',
		keyBuffer,
		{ name: algorithm, length: 256 },
		false,
		[type],
	)
	return { key, iv }
}

export const aes256Encrypt = async (
	data: string | Record<string, any> | Record<string, any>[],
): Promise<string> => {
	const { key, iv } = await getKeyAndIv('encrypt')
	const dataToEncrypt = new TextEncoder().encode(
		typeof data === 'string' ? data : JSON.stringify(data),
	)
	const encrypted = await crypto.subtle.encrypt(
		{ name: algorithm, iv },
		key,
		dataToEncrypt,
	)
	return btoa(String.fromCharCode(...new Uint8Array(encrypted)))
}

export const aes256Decrypt = async <T>(encrypted: string): Promise<T> => {
	const { key, iv } = await getKeyAndIv('decrypt')
	const encryptedBytes = new Uint8Array(
		atob(encrypted)
			.split('')
			.map(char => char.charCodeAt(0)),
	)
	const decryptedBuffer = await crypto.subtle.decrypt(
		{ name: algorithm, iv },
		key,
		encryptedBytes,
	)
	const decryptedText = new TextDecoder().decode(decryptedBuffer)

	try {
		return JSON.parse(decryptedText) as T
	} catch {
		return decryptedText as T
	}
}

// region jwt
export const signJwt = async (payload: Record<string, any>) => {
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setNotBefore(env.JWT_ACCESS_TOKEN_NOT_BEFORE_EXPIRATION)
		.setExpirationTime(env.JWT_ACCESS_TOKEN_EXPIRED)
		.setAudience(env.JWT_AUDIENCE)
		.setIssuer(env.JWT_ISSUER)
		.setSubject(env.JWT_SUBJECT)
		.sign(new TextEncoder().encode(env.JWT_ACCESS_TOKEN_SECRET_KEY))
}

export const verifyJwt = async (
	token: string,
): Promise<IJwtVerified | null> => {
	try {
		const { payload } = await jwtVerify(
			token,
			new TextEncoder().encode(env.JWT_ACCESS_TOKEN_SECRET_KEY),
		)
		return payload as IJwtVerified
	} catch (error) {
		return null
	}
}
