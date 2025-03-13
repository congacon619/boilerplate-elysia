import mitt from 'mitt'

export const userEmitter = mitt<{
	userUpdated: { id: string }
}>()
