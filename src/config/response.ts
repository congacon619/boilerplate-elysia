import { RES_CODE } from '../common'

export const castToRes = <T>(data: T) => ({
	data,
	t: new Date().toISOString(),
	code: RES_CODE.SUCCESS,
})
