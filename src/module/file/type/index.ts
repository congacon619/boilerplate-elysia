export interface IStorageBackend {
	upload(file: File, options: IContentType): Promise<string>
	download(filename: string): Promise<IDownloadRes>
}

export interface IDownloadRes {
	content: Blob
	contentType: {
		mime: string
		ext: string
	}
}

export interface IContentType {
	mime: string
	ext: string
}
