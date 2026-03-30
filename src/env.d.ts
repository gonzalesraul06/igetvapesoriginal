/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly RESEND_API_KEY?: string;
	readonly RESEND_FROM_EMAIL?: string;
	readonly RESEND_REPLY_TO?: string;
	readonly RESEND_ADMIN_EMAIL?: string;
	readonly SUPPORT_EMAIL?: string;
	readonly SITE_URL?: string;
	readonly PUBLIC_SITE_URL?: string;
	readonly STORE_NAME?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
