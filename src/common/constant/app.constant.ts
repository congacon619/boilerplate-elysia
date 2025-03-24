// region app
export enum LANG {
	VI = 'vi',
	EN = 'en',
	ZH = 'zh',
	KO = 'ko',
}
export const AVAILABLE_LANGUAGES = Object.values(LANG)
export const DEFAULT_LANGUAGE = LANG.EN

export enum APP_ENV {
	TEST = 'test',
	DEV = 'dev',
	PROD = 'prod',
}

export enum LOG_LEVEL {
	FATAL = 'fatal',
	ERROR = 'error',
	WARN = 'warn',
	INFO = 'info',
	DEBUG = 'debug',
	TRACE = 'trace',
}

export enum SETTING {
	MAINTENANCE_END_DATE = 'MAINTENANCE_END_DATE',

	ENB_PASSWORD_ATTEMPT = 'ENB_PASSWORD_ATTEMPT',
	ENB_PASSWORD_EXPIRED = 'ENB_PASSWORD_EXPIRED',

	ENB_JWT_PAYLOAD_ENCRYPT = 'ENB_JWT_PAYLOAD_ENCRYPT',

	ENB_MFA_REQUIRED = 'ENB_MFA_REQUIRED',
	ENB_IP_WHITELIST = 'ENB_IP_WHITELIST',
	ENB_ONLY_ONE_SESSION = 'ENB_ONLY_ONE_SESSION',
}

// region regex
export const REGEX_TIME =
	/^\d+\s*(seconds?|minutes?|hours?|days?|weeks?|months?|years?)$/i
export const PASSWORD_REGEX =
	/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/

// region request
export enum HTTP_METHOD {
	GET = 'GET',
	POST = 'POST',
	PUT = 'PUT',
	PATCH = 'PATCH',
	DELETE = 'DELETE',
	OPTIONS = 'OPTIONS',
	HEAD = 'HEAD',
}
export const REGEX_HTTP_METHOD = `^(${Object.values(HTTP_METHOD).join('|')})(,(${Object.values(HTTP_METHOD).join('|')}))*$`

// region db
export enum PREFIX {
	SESSION = 'session',
	USER = 'user',
	ROLE_USER = 'role_user',
	ROLE = 'role',
	I18N = 'i18n',
	API_KEY = 'api_key',
	ACTIVITY = 'activity',
	IP_WHITELIST = 'ip_whitelist',
	SETTING = 'setting',
	TELEGRAM_BOT = 'tele_bot',
	TELEGRAM_CHAT = 'tele_chat',
	TELEGRAM_TEMPLATE = 'tele_template',
}

// region role permissions
export enum ROLE_NAME {
	SYSTEM = 'SYSTEM',
	USER = 'USER',
}

export enum PERMISSION {
	ACTIVITY_VIEW = 'ACTIVITY.VIEW',
	ACTIVITY_VIEW_ALL = 'ACTIVITY.VIEW_ALL',

	SESSION_VIEW = 'SESSION.VIEW',
	SESSION_VIEW_ALL = 'SESSION.VIEW_ALL',
	SESSION_REVOKE = 'SESSION.REVOKE',
	SESSION_REVOKE_ALL = 'SESSION.REVOKE_ALL',

	SETTING_VIEW = 'SETTING.VIEW',
	SETTING_UPDATE = 'SETTING.UPDATE',

	I18N_VIEW = 'I18N.VIEW',
	I18N_UPDATE = 'I18N.UPDATE',
	I18N_DELETE = 'I18N.DELETE',

	IP_WHITELIST_VIEW = 'IPWHITELIST.VIEW',
	IP_WHITELIST_CREATE = 'IPWHITELIST.CREATE',
	IP_WHITELIST_DELETE = 'IPWHITELIST.DELETE',

	USER_VIEW = 'USER.VIEW',
	USER_UPDATE = 'USER.UPDATE',
	USER_RESET_MFA = 'USER.RESET_MFA',

	ROLE_VIEW = 'ROLE.VIEW',
	ROLE_UPDATE = 'ROLE.UPDATE',
	ROLE_DELETE = 'ROLE.DELETE',

	FILE_UPLOAD = 'FILE.UPLOAD',

	TELEGRAM_BOT_VIEW = 'TELEGRAM_BOT.VIEW',
	TELEGRAM_BOT_UPDATE = 'TELEGRAM_BOT.UPDATE',
	TELEGRAM_BOT_DELETE = 'TELEGRAM_BOT.DELETE',

	TELEGRAM_CHAT_VIEW = 'TELEGRAM_CHAT.VIEW',
	TELEGRAM_CHAT_UPDATE = 'TELEGRAM_CHAT.UPDATE',
	TELEGRAM_CHAT_DELETE = 'TELEGRAM_CHAT.DELETE',

	TELEGRAM_TEMPLATE_VIEW = 'TELEGRAM_TEMPLATE.VIEW',
	TELEGRAM_TEMPLATE_UPDATE = 'TELEGRAM_TEMPLATE.UPDATE',
	TELEGRAM_TEMPLATE_DELETE = 'TELEGRAM_TEMPLATE.DELETE',
	TELEGRAM_TEMPLATE_SEND = 'TELEGRAM_TEMPLATE.SEND',

	API_KEY_VIEW = 'API_KEY.VIEW',
	API_KEY_VIEW_ALL = 'API_KEY.VIEW_ALL',
	API_KEY_UPDATE = 'API_KEY.UPDATE',
	API_KEY_UPDATE_ALL = 'API_KEY.UPDATE_ALL',
}

// region queue
export enum QUEUE {
	TELEGRAM_QUEUE = 'TELEGRAM_QUEUE',
}

export enum TASK_NAME {
	SEND_TELEGRAM_MESSAGE = 'SEND_TELEGRAM_MESSAGE',
}

export const DOC_OPTIONS = {
	info: {
		title: 'Elysia Documentation',
		description: 'Development documentation',
		contact: {
			name: 'Nguyen Van Vy',
			url: 'https://www.facebook.com/vy.nguyenvan.79656',
			email: 'nguyenvanvy1999@gmail.com',
		},
		license: { name: 'MIT', url: 'https://opensource.org/license/mit' },
		termsOfService: 'termsOfService',
	},
	tags: {
		auth: { name: 'Auth', description: 'Authentication endpoints' },
		activity: { name: 'Activity', description: 'Activity endpoints' },
		user: { name: 'User', description: 'User endpoints' },
		misc: { name: 'MISC', description: 'MISC endpoints' },
		mfa: { name: 'MFA', description: 'MFA endpoints' },
		apiKey: { name: 'ApiKey', description: 'ApiKey endpoints' },
		setting: { name: 'Setting', description: 'Setting endpoints' },
		permission: { name: 'Permission', description: 'Permission endpoints' },
		session: { name: 'Session', description: 'Session endpoints' },
		i18n: { name: 'I18n', description: 'I18n endpoints' },
		file: { name: 'File', description: 'File endpoints' },
		ipWhitelist: { name: 'IPWhitelist', description: 'IPWhitelist endpoints' },
		role: { name: 'Role', description: 'Role endpoints' },
		telegramBot: {
			name: 'Telegram bot',
			description: 'Telegram bot endpoints',
		},
		telegramChat: {
			name: 'Telegram chat',
			description: 'Telegram chat endpoints',
		},
		telegramTemplate: {
			name: 'Telegram template',
			description: 'Telegram template endpoints',
		},
		captcha: { name: 'Captcha', description: 'Captcha endpoints' },
	},
}

// region cache
export enum CACHE_NS {
	ACCESS_TOKEN = 'access-token',
	LOGIN = 'login',
	SETTING = 'setting',
	MFA_SETUP = 'mfa-setup',
	MFA = 'mfa',
	IP_WHITELIST = 'ip-whitelist',
	CURRENT_USER = 'currency-user',
	CHANGE_PASSWORD = 'change-password',
	CAPTCHA = 'captcha',
}

// region http

export const CORS_ALLOW_HEADERS = [
	'Accept',
	'Accept-Language',
	'Content-Language',
	'Content-Type',
	'Origin',
	'Authorization',
	'Access-Control-Request-Method',
	'Access-Control-Request-Headers',
	'Access-Control-Allow-Headers',
	'Access-Control-Allow-Origin',
	'Access-Control-Allow-Methods',
	'Access-Control-Allow-Credentials',
	'Access-Control-Expose-Headers',
	'Access-Control-Max-Age',
	'Referer',
	'Host',
	'X-Requested-With',
	'x-custom-lang',
	'x-timestamp',
	'x-api-key',
	'x-timezone',
	'x-request-id',
	'x-version',
	'x-repo-version',
	'X-Response-Time',
	'user-agent',
	'User-Agent',
]

export const ROUTER = {
	ROOT: '/',
	AUTH: {
		LOGIN: '/login',
		LOGIN_CONFIRM: '/login/confirm',
		LOGOUT: '/logout',
		REGISTER: '/register',
		REFRESH_TOKEN: '/refresh-token',
		CURRENT_USER: '/current-user',
		CHANGE_PASSWORD: '/change-password/request',
		CHANGE_PASSWORD_CONFIRM: '/change-password/confirm',
	},
	MISC: {
		ROOT: '/misc',
		PREFLIGHT: '/preflight',
		HEALTH_CHECK: '/health-check',
		TIME: '/time',
		IP: '/ip',
		VERSION: '/version',
	},
	SETTING: {
		ROOT: '/settings',
		UPDATE: '/:id',
	},
	I18N: {
		ROOT: '/i18n',
		DEL: '/del',
		IMPORT: '/import',
		EXPORT: '/export',
	},
	USER: {
		ROOT: '/users',
	},
	ROLE: {
		ROOT: '/roles',
		DEL: '/del',
	},
	PERMISSION: {
		ROOT: '/permissions',
	},
	IP_WHITELIST: {
		ROOT: '/ipwhitelist',
		DEL: '/del',
	},
	SESSION: {
		ROOT: '/sessions',
		REVOKE: '/:id/revoke',
	},
	ACTIVITY: {
		ROOT: '/activities',
	},
	MFA: {
		ROOT: '/mfa',
		REQUEST: '/setup/request',
		CONFIRM: '/setup/confirm',
		RESET_REQUEST: '/reset-mfa/request',
		RESET_CONFIRM: '/reset-mfa/confirm',
	},
	FILE: {
		ROOT: '/files',
		UPLOAD: '/image-upload',
		DOWNLOAD: '/:filename',
	},
	TELEGRAM_BOT: {
		ROOT: '/telegram-bot',
		DEL: '/del',
	},
	TELEGRAM_CHAT: {
		ROOT: '/telegram-chat',
		DEL: '/del',
	},
	TELEGRAM_TEMPLATE: {
		ROOT: '/telegram-template',
		DEL: '/del',
		SEND: '/send',
		MANUAL_SEND: '/manual-send',
	},
	API_KEY: {
		ROOT: '/api-keys',
		RESET: '/reset/:id',
	},
	CAPTCHA: {
		ROOT: '/captcha',
		VERIFY: '/verify',
	},
}

export const DOC_DETAIL = {
	// auth APIs
	LOGIN: {
		description: 'Login with email and password',
		summary: 'Login',
	},
	LOGIN_CONFIRM: {
		description: 'Confirm login with OTP',
		summary: 'Confirm Login',
	},
	CURRENT_USER: {
		description: 'Get current user information',
		summary: 'Current user info',
	},
	REFRESH_TOKEN: {
		description: 'Refresh token',
		summary: 'Refresh token',
	},
	REGISTER: {
		description: 'Register new user with role user',
		summary: 'Register',
	},
	LOGOUT: {
		description: 'Logout from this device',
		summary: 'Logout',
	},
	CHANGE_PASSWORD: {
		description: 'Change password',
		summary: 'Change password',
	},
	CHANGE_PASSWORD_CONFIRM: {
		description: 'Confirm change password',
		summary: 'Confirm change password',
	},

	ACTIVITY_PAGINATE: {
		description: 'Activity paging',
		summary: 'Activity paging',
	},

	USER_PAGINATE: {
		description: 'User paging',
		summary: 'User paging',
	},
	USER_UPSERT: {
		description: 'User upsert',
		summary: 'User upsert',
	},

	HEALTH_CHECK: {
		description: 'Health check',
		summary: 'Health check',
	},
	PREFLIGHT: {
		description: 'Preflight',
		summary: 'Preflight',
	},
	GET_TIME: {
		description: 'Get server time',
		summary: 'Get server time',
	},
	GET_VERSION: {
		description: 'Get server version',
		summary: 'Get server version',
	},

	MFA_SETUP_REQUEST: {
		description: 'Create request setup MFA',
		summary: 'Create request setup MFA',
	},
	MFA_SETUP_CONFIRM: {
		description: 'Confirm setup MFA',
		summary: 'Confirm setup MFA',
	},
	MFA_RESET_REQUEST: {
		description: 'Request reset MFA',
		summary: 'Request reset MFA',
	},
	MFA_RESET_CONFIRM: {
		description: 'Confirm reset MFA',
		summary: 'Confirm reset MFA',
	},

	API_KEY_PAGINATE: {
		description: 'ApiKey paging',
		summary: 'ApiKey paging',
	},
	API_KEY_UPSERT: {
		description: 'ApiKey upsert',
		summary: 'ApiKey upsert',
	},
	API_KEY_RESET: {
		description: 'ApiKey reset',
		summary: 'ApiKey reset',
	},

	SETTING_GET_ALL: {
		description: 'Setting get all',
		summary: 'Setting get all',
	},
	SETTING_UPDATE: {
		description: 'Setting update',
		summary: 'Setting update',
	},

	PERMISSION_GET_ALL: {
		description: 'Permissions get all',
		summary: 'Permissions get all',
	},

	SESSION_PAGINATE: {
		description: 'Session paging',
		summary: 'Session paging',
	},
	SESSION_REVOKE: {
		description: 'Session revoke',
		summary: 'Session revoke',
	},

	I18N_GET_ALL: {
		description: 'I18n get all',
		summary: 'I18n get all',
	},
	I18N_UPSERT: {
		description: 'I18n upsert',
		summary: 'I18n upsert',
	},
	I18N_DEL: {
		description: 'I18n delete',
		summary: 'I18n delete',
	},
	I18N_IMPORT: {
		description: 'I18n import',
		summary: 'I18n import',
	},
	I18N_EXPORT: {
		description: 'I18n export',
		summary: 'I18n export',
	},

	FILE_UPLOAD: {
		description: 'File upload',
		summary: 'File upload',
	},
	FILE_DOWNLOAD: {
		description: 'File download',
		summary: 'File download',
	},

	IP_WHITELIST_GET_ALL: {
		description: 'IPWhitelist get all',
		summary: 'IPWhitelist get all',
	},
	IP_WHITELIST_CREATE: {
		description: 'IPWhitelist create',
		summary: 'IPWhitelist create',
	},
	IP_WHITELIST_DEL: {
		description: 'IPWhitelist delete',
		summary: 'IPWhitelist delete',
	},

	ROLE_PAGINATE: {
		description: 'Role paginate',
		summary: 'Role paginate',
	},
	ROLE_UPSERT: {
		description: 'Role upsert',
		summary: 'Role upsert',
	},
	ROLE_DEL: {
		description: 'Role delete',
		summary: 'Role delete',
	},

	TELE_BOT_PAGINATE: {
		description: 'Telegram bot paginate',
		summary: 'Telegram bot paginate',
	},
	TELE_BOT_UPSERT: {
		description: 'Telegram bot upsert',
		summary: 'Telegram bot upsert',
	},
	TELE_BOT_DEL: {
		description: 'Telegram bot delete',
		summary: 'Telegram bot delete',
	},

	TELE_CHAT_PAGINATE: {
		description: 'Telegram chat paginate',
		summary: 'Telegram chat paginate',
	},
	TELE_CHAT_UPSERT: {
		description: 'Telegram chat upsert',
		summary: 'Telegram chat upsert',
	},
	TELE_CHAT_DEL: {
		description: 'Telegram chat delete',
		summary: 'Telegram chat delete',
	},

	TELE_TEMPLATE_PAGINATE: {
		description: 'Telegram template paginate',
		summary: 'Telegram template paginate',
	},
	TELE_TEMPLATE_UPSERT: {
		description: 'Telegram template upsert',
		summary: 'Telegram template upsert',
	},
	TELE_TEMPLATE_DEL: {
		description: 'Telegram template delete',
		summary: 'Telegram template delete',
	},
	TELE_TEMPLATE_SEND: {
		description: 'Telegram template send',
		summary: 'Telegram template send',
	},
	TELE_SEND_MANUAL: {
		description: 'Telegram send manual message',
		summary: 'Telegram send manual message',
	},

	CAPTCHA_GENERATE: {
		description: 'Captcha generate',
		summary: 'Captcha generate',
	},
	CAPTCHA_VERIFY: {
		description: 'Captcha verify',
		summary: 'Captcha verify',
	},
}

export enum RES_CODE {
	SUCCESS = 'success',
	ISE = 'ise',
	VALIDATION_ERROR = 'validation-error',
	NOT_FOUND = 'not-found',
}

export enum HTTP_STATUS {
	// Informational Responses
	HTTP_100_CONTINUE = 100,
	HTTP_101_SWITCHING_PROTOCOLS = 101,
	HTTP_102_PROCESSING = 102,
	HTTP_103_EARLY_HINTS = 103,

	// Successful Responses
	HTTP_200_OK = 200,
	HTTP_201_CREATED = 201,
	HTTP_202_ACCEPTED = 202,
	HTTP_203_NON_AUTHORITATIVE_INFORMATION = 203,
	HTTP_204_NO_CONTENT = 204,
	HTTP_205_RESET_CONTENT = 205,
	HTTP_206_PARTIAL_CONTENT = 206,
	HTTP_207_MULTI_STATUS = 207,
	HTTP_208_ALREADY_REPORTED = 208,
	HTTP_226_IM_USED = 226,

	// Redirection Messages
	HTTP_300_MULTIPLE_CHOICES = 300,
	HTTP_301_MOVED_PERMANENTLY = 301,
	HTTP_302_FOUND = 302,
	HTTP_303_SEE_OTHER = 303,
	HTTP_304_NOT_MODIFIED = 304,
	HTTP_305_USE_PROXY = 305,
	HTTP_306_RESERVED = 306,
	HTTP_307_TEMPORARY_REDIRECT = 307,
	HTTP_308_PERMANENT_REDIRECT = 308,

	// Client Error Responses
	HTTP_400_BAD_REQUEST = 400,
	HTTP_401_UNAUTHORIZED = 401,
	HTTP_402_PAYMENT_REQUIRED = 402,
	HTTP_403_FORBIDDEN = 403,
	HTTP_404_NOT_FOUND = 404,
	HTTP_405_METHOD_NOT_ALLOWED = 405,
	HTTP_406_NOT_ACCEPTABLE = 406,
	HTTP_407_PROXY_AUTHENTICATION_REQUIRED = 407,
	HTTP_408_REQUEST_TIMEOUT = 408,
	HTTP_409_CONFLICT = 409,
	HTTP_410_GONE = 410,
	HTTP_411_LENGTH_REQUIRED = 411,
	HTTP_412_PRECONDITION_FAILED = 412,
	HTTP_413_REQUEST_ENTITY_TOO_LARGE = 413,
	HTTP_414_REQUEST_URI_TOO_LONG = 414,
	HTTP_415_UNSUPPORTED_MEDIA_TYPE = 415,
	HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE = 416,
	HTTP_417_EXPECTATION_FAILED = 417,
	HTTP_418_IM_A_TEAPOT = 418,
	HTTP_421_MISDIRECTED_REQUEST = 421,
	HTTP_422_UNPROCESSABLE_ENTITY = 422,
	HTTP_423_LOCKED = 423,
	HTTP_424_FAILED_DEPENDENCY = 424,
	HTTP_425_TOO_EARLY = 425,
	HTTP_426_UPGRADE_REQUIRED = 426,
	HTTP_428_PRECONDITION_REQUIRED = 428,
	HTTP_429_TOO_MANY_REQUESTS = 429,
	HTTP_431_REQUEST_HEADER_FIELDS_TOO_LARGE = 431,
	HTTP_451_UNAVAILABLE_FOR_LEGAL_REASONS = 451,

	// Server Error Responses
	HTTP_500_INTERNAL_SERVER_ERROR = 500,
	HTTP_501_NOT_IMPLEMENTED = 501,
	HTTP_502_BAD_GATEWAY = 502,
	HTTP_503_SERVICE_UNAVAILABLE = 503,
	HTTP_504_GATEWAY_TIMEOUT = 504,
	HTTP_505_HTTP_VERSION_NOT_SUPPORTED = 505,
	HTTP_506_VARIANT_ALSO_NEGOTIATES = 506,
	HTTP_507_INSUFFICIENT_STORAGE = 507,
	HTTP_508_LOOP_DETECTED = 508,
	HTTP_509_BANDWIDTH_LIMIT_EXCEEDED = 509,
	HTTP_510_NOT_EXTENDED = 510,
	HTTP_511_NETWORK_AUTHENTICATION_REQUIRED = 511,
}

// region activity
export enum ACTIVITY_TYPE {
	LOGIN = 'login',
	LOGOUT = 'logout',
	REGISTER = 'register',
	CHANGE_PASSWORD = 'change-password',
	SETUP_MFA = 'setup-mfa',

	CREATE_USER = 'create-user',
	UPDATE_USER = 'update-user',

	CREATE_ROLE = 'create-role',
	UPDATE_ROLE = 'update-role',
	DEL_ROLE = 'del-role',

	REVOKE_SESSION = 'revoke-session',
	RESET_MFA = 'reset-mfa',

	CREATE_IP_WHITELIST = 'create-ipwhitelist',
	DEL_IP_WHITELIST = 'del-ipwhitelist',

	UPDATE_SETTING = 'update-setting',

	CREATE_TELEGRAM_BOT = 'create-telegram-bot',
	UPDATE_TELEGRAM_BOT = 'update-telegram-bot',
	DEL_TELEGRAM_BOT = 'del-telegram-bot',

	CREATE_PROXY = 'create-proxy',
	UPDATE_PROXY = 'update-proxy',
	DEL_PROXY = 'del-proxy',

	CREATE_GATE = 'create-gate',
	UPDATE_GATE = 'update-gate',
	DEL_GATE = 'del-gate',

	CREATE_API_KEY = 'create-api-key',
	UPDATE_API_KEY = 'update-api-key',
}

export enum HEALTH_STATE {
	ERROR = 'error',
	OK = 'ok',
}
