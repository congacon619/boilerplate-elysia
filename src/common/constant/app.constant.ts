// region app
export enum LANG {
	VI = "vi",
	EN = "en",
	ZH = "zh",
	KO = "ko",
}
export const AVAILABLE_LANGUAGES = Object.values(LANG);
export const DEFAULT_LANGUAGE = LANG.EN;

export enum APP_ENV {
	TEST = "test",
	DEV = "dev",
	PROD = "prod",
}

export enum SETTING {
	MAINTENANCE_END_DATE = "MAINTENANCE_END_DATE",

	ENB_PASSWORD_ATTEMPT = "ENB_PASSWORD_ATTEMPT",
	ENB_PASSWORD_EXPIRED = "ENB_PASSWORD_EXPIRED",

	ENB_JWT_PAYLOAD_ENCRYPT = "ENB_JWT_PAYLOAD_ENCRYPT",

	ENB_MFA_REQUIRED = "ENB_MFA_REQUIRED",
	ENB_IP_WHITELIST = "ENB_IP_WHITELIST",
	ENB_ONLY_ONE_SESSION = "ENB_ONLY_ONE_SESSION",
}

// region regex
export const REGEX_SIZE = /^[0-9]+(kb|MB|GB|TB)$/i;
export const REGEX_TIME = /^\d+(s|m|h|d|w|mo|y)$/i;
export const SENTRY_DSN_REGEX =
	/https:\/\/[\da-f]{32}@o\d+\.ingest\.sentry\.io\/\d+/;

// region request
export enum HTTP_METHOD {
	GET = "GET",
	POST = "POST",
	PUT = "PUT",
	PATCH = "PATCH",
	DELETE = "DELETE",
	OPTIONS = "OPTIONS",
	HEAD = "HEAD",
}
export const REGEX_HTTP_METHOD = `^(${Object.values(HTTP_METHOD).join("|")})(,(${Object.values(HTTP_METHOD).join("|")}))*$`;

export enum HEADER {
	DEVICE_ID = "device-id",
	AUTHORIZATION = "authorization",
	X_TIMEZONE = "x-timezone",
	X_CUSTOM_LANGUAGE = "x-custom-lang",
	X_TIMESTAMP = "x-timestamp",
	X_REQUEST_ID = "x-request-id",
	X_VERSION = "x-version",
	X_REPO_VERSION = "x-repo-version",
}

// region file
export enum FILE_MIME {
	JPG = "image/jpg",
	JPEG = "image/jpeg",
	PNG = "image/png",
	XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	CSV = "text/csv",
	PDF = "application/pdf",
	MPEG = "audio/mpeg",
	MP3 = "audio/mp3",
	M4A = "audio/x-m4a",
	MP4 = "video/mp4",
}

// region db
export enum PREFIX {
	SESSION = "session",
	USER = "user",
	ROLE_USER = "role_user",
	ROLE = "role",
	I18N = "i18n",
	API_KEY = "api_key",
	ACTIVITY = "activity",
	IP_WHITELIST = "ip_whitelist",
	SETTING = "setting",
	TELEGRAM_BOT = "tele_bot",
	TELEGRAM_CHAT = "tele_chat",
	TELEGRAM_TEMPLATE = "tele_template",
	SOCKET = "socket",
}

// region role permissions
export enum ROLE_NAME {
	SYSTEM = "SYSTEM",
	USER = "USER",
}

export enum PERMISSION {
	ACTIVITY_VIEW = "ACTIVITY.VIEW",
	ACTIVITY_VIEW_ALL = "ACTIVITY.VIEW_ALL",

	SESSION_VIEW = "SESSION.VIEW",
	SESSION_VIEW_ALL = "SESSION.VIEW_ALL",
	SESSION_REVOKE = "SESSION.REVOKE",
	SESSION_REVOKE_ALL = "SESSION.REVOKE_ALL",

	SETTING_VIEW = "SETTING.VIEW",
	SETTING_UPDATE = "SETTING.UPDATE",

	I18N_VIEW = "I18N.VIEW",
	I18N_UPDATE = "I18N.UPDATE",
	I18N_DELETE = "I18N.DELETE",

	IP_WHITELIST_VIEW = "IPWHITELIST.VIEW",
	IP_WHITELIST_CREATE = "IPWHITELIST.CREATE",
	IP_WHITELIST_DELETE = "IPWHITELIST.DELETE",

	USER_VIEW = "USER.VIEW",
	USER_UPDATE = "USER.UPDATE",
	USER_RESET_MFA = "USER.RESET_MFA",

	ROLE_VIEW = "ROLE.VIEW",
	ROLE_UPDATE = "ROLE.UPDATE",
	ROLE_DELETE = "ROLE.DELETE",

	FILE_UPLOAD = "FILE.UPLOAD",

	TELEGRAM_BOT_VIEW = "TELEGRAM_BOT.VIEW",
	TELEGRAM_BOT_UPDATE = "TELEGRAM_BOT.UPDATE",
	TELEGRAM_BOT_DELETE = "TELEGRAM_BOT.DELETE",

	TELEGRAM_CHAT_VIEW = "TELEGRAM_CHAT.VIEW",
	TELEGRAM_CHAT_UPDATE = "TELEGRAM_CHAT.UPDATE",
	TELEGRAM_CHAT_DELETE = "TELEGRAM_CHAT.DELETE",

	TELEGRAM_TEMPLATE_VIEW = "TELEGRAM_TEMPLATE.VIEW",
	TELEGRAM_TEMPLATE_UPDATE = "TELEGRAM_TEMPLATE.UPDATE",
	TELEGRAM_TEMPLATE_DELETE = "TELEGRAM_TEMPLATE.DELETE",
	TELEGRAM_TEMPLATE_SEND = "TELEGRAM_TEMPLATE.SEND",

	API_KEY_VIEW = "API_KEY.VIEW",
	API_KEY_VIEW_ALL = "API_KEY.VIEW_ALL",
	API_KEY_UPDATE = "API_KEY.UPDATE",
	API_KEY_DELETE = "API_KEY.DELETE",
}

export enum RES_CODE {
	SUCCESS = "success",
	ISE = "ise",
	VALIDATION_ERROR = "validation-error",
}

// region queue
export enum QUEUE {
	TELEGRAM_QUEUE = "TELEGRAM_QUEUE",
}

export enum TASK_NAME {
	SEND_TELEGRAM_MESSAGE = "SEND_TELEGRAM_MESSAGE",
}

export enum BULL_ERROR {
	JOB_ID_EXISTED = "job_id_existed",
	INIT_FAILED = "init_failed",
}

export enum EVENT {
	USER_UPDATED = "user_updated",
}

// region cli
export enum CLI_COMMAND {
	SYSTEM_INFO = "system-info",
	CREATE_USER = "create-user",
}

export enum CLI_QUESTION {
	ASK_USERNAME = "ask-user-name",
	ASK_PASSWORD = "ask-password",
	ASK_ROLE = "ask-role",
}

// region WS
export enum WS_NAMESPACES {
	USER = "user",
}

export const WS_EVENTS = {
	EXCEPTION: "exception",
	CONNECT_SUCCEED: "connect-succeed",
	USER: {
		REFRESH_TOKEN: "refresh-token",
	},
};

export const DOC_OPTIONS = {
	info: {
		title: "Elysia Documentation",
		description: "Development documentation",
		contact: {
			name: "Nguyen Van Vy",
			url: "https://www.facebook.com/vy.nguyenvan.79656",
			email: "nguyenvanvy1999@gmail.com",
		},
		license: { name: "MIT", url: "https://opensource.org/license/mit" },
		termsOfService: "termsOfService",
	},
	tags: {
		auth: { name: "Auth", description: "Authentication endpoints" },
		app: { name: "App", description: "General endpoints" },
		user: { name: "User", description: "User endpoints" },
		setting: { name: "Setting", description: "Setting endpoints" },
		device: { name: "Device", description: "Device management endpoints" },
		permission: { name: "Permission", description: "Permission endpoints" },
		role: { name: "Role", description: "Role endpoints" },
	},
};
