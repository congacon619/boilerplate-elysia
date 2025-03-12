export enum LOGIN_WITH {
	LOCAL = 'LOCAL',
	GOOGLE = 'GOOGLE',
	FACEBOOK = 'FACEBOOK',
}

export enum MFA_METHOD {
	TELEGRAM = 'telegram',
	TOTP = 'totp',
}

export enum LOGIN_RES_TYPE {
	COMPLETED = 'completed',
	MFA_SETUP = 'mfa-setup',
	MFA_CONFIRM = 'mfa-confirm',
}
