import 'i18next'
import { resources } from '../../config'

export type I18nPath = GenerateI18nPath<(typeof resources)['en']['translation']>

type GenerateI18nPath<T, Prefix extends string = ''> = {
	[K in keyof T]: T[K] extends object
		? GenerateI18nPath<T[K], `${Prefix}${K}.`>
		: `${Prefix}${K}`
}[keyof T]

declare module 'i18next' {
	interface CustomTypeOptions {
		resources: (typeof resources)['en']
	}
}
