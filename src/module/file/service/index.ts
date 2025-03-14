import { logger } from '../../../config'
import { IStorageBackend } from '../type'
import { FileStorageBackend } from './file.storage'
import { S3StorageBackend } from './s3.storage'

export const storageBackend: IStorageBackend = (() => {
	try {
		const s3Storage = new S3StorageBackend()
		logger.warn('Using S3StorageBackend')
		return s3Storage
	} catch (e) {
		logger.error(e)
		logger.warn('Using FileStorageBackend')
		return new FileStorageBackend()
	}
})()
