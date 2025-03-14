import path from 'node:path'
import { extension, lookup } from 'mime-types'
import { APP_ENV, BadRequestException, token16 } from '../../../common'
import { env } from '../../../config'
import { IDownloadRes, IStorageBackend } from '../type'

export class FileStorageBackend implements IStorageBackend {
	private readonly imageDir: string

	constructor() {
		this.imageDir =
			env.APP_ENV === APP_ENV.PROD
				? '/data/images'
				: Bun.pathToFileURL('tmp/images').pathname
	}

	async upload(file: File): Promise<string> {
		const ext = path.extname(file.name) || 'bin'
		const fileName = `${token16()}${ext}`
		const destinationPath = `${this.imageDir}/${fileName}`
		await Bun.write(destinationPath, file, { createPath: true })
		return fileName
	}

	async download(fileName: string): Promise<IDownloadRes> {
		const filePath = path.join(this.imageDir, fileName)
		const file = Bun.file(filePath)
		if (!(await file.exists())) {
			throw new BadRequestException('exception.invalid-file')
		}
		const fileBlob = await file.arrayBuffer()
		const mime = lookup(fileName) || 'application/octet-stream'
		const ext = extension(mime) || 'bin'
		return {
			content: new Blob([fileBlob], { type: mime }),
			contentType: { mime, ext },
		}
	}
}
