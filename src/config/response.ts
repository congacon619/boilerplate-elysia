import { RES_CODE } from '../common'

export const castToRes = <T>(data: T) => ({
	data,
	code: RES_CODE.SUCCESS,
	t: new Date().toISOString(),
})
