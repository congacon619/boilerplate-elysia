export interface IStorageBackend {
	upload(file: File): Promise<string>
	download(filename: string): Promise<IDownloadRes>
}

export interface IDownloadRes {
	content: Blob
	contentType: {
		mime: string
		ext: string
	}
}
