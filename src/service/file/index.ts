import { IStorageBackend } from '../../common'
import { logger } from '../../config'
import { FileStorageBackend } from './file.storage'
import { S3StorageBackend } from './s3.storage'

export const storageBackend: IStorageBackend = (() => {
	try {
		const s3Storage = new S3StorageBackend()
		logger.info('Using S3StorageBackend')
		return s3Storage
	} catch (e) {
		logger.error(e)
		logger.info('Using FileStorageBackend')
		return new FileStorageBackend()
	}
})()
