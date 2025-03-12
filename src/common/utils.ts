import { customAlphabet } from 'nanoid'
import ms, { StringValue } from 'ms'
import { env } from '../config'
import dayjs from 'dayjs'

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

// region time
export function seconds(time: string): number {
	const result = ms(time as StringValue)
	return result / 1000
}
export function milliseconds(time: string): number {
	return ms(time as StringValue)
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
