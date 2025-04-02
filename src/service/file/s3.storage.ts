import path from 'node:path'
import { S3Client } from 'bun'
import { extension, lookup } from 'mime-types'
import { BadReqErr, IDownloadRes, IStorageBackend, token16 } from '../../common'
import { env } from '../../config'

export class S3StorageBackend implements IStorageBackend {
	private s3: S3Client

	constructor() {
		if (
			!env.S3_ACCESS_KEY ||
			!env.S3_BUCKET ||
			!env.S3_ENDPOINT ||
			!env.S3_SECRET_KEY
		) {
			throw new Error('Missing S3 configuration')
		}

		this.s3 = new S3Client({
			endpoint: env.S3_ENDPOINT,
			accessKeyId: env.S3_ACCESS_KEY,
			secretAccessKey: env.S3_SECRET_KEY,
			region: env.S3_REGION ?? 'default',
		})
	}

	async upload(file: File): Promise<string> {
		const ext = path.extname(file.name) || 'bin'
		const fileName = `${token16()}${ext}`
		const s3file = this.s3.file(fileName)
		await s3file.write(file, { type: file.type })
		return fileName
	}

	async download(fileName: string): Promise<IDownloadRes> {
		const s3file = this.s3.file(fileName)
		if (!(await s3file.exists())) {
			throw new BadReqErr('exception.file-not-found')
		}
		const fileBlob = await s3file.arrayBuffer()
		const mime = lookup(fileName) || 'application/octet-stream'
		const ext = extension(mime) || 'bin'
		return {
			content: new Blob([fileBlob], { type: mime }),
			contentType: { mime, ext },
		}
	}
}
