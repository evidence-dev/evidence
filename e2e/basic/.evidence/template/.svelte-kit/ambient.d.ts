
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://kit.svelte.dev/docs/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```bash
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const _tide_location_color: string;
	export const USER: string;
	export const WORKON_HOME: string;
	export const npm_config_user_agent: string;
	export const BUN_INSTALL: string;
	export const npm_node_execpath: string;
	export const SHLVL: string;
	export const WT_PROFILE_ID: string;
	export const npm_config_noproxy: string;
	export const HOME: string;
	export const npm_package_json: string;
	export const npm_package_engines_node: string;
	export const nvm_current_version: string;
	export const _tide_color_anchors: string;
	export const npm_config_userconfig: string;
	export const npm_config_local_prefix: string;
	export const GOROOT: string;
	export const DBUS_SESSION_BUS_ADDRESS: string;
	export const WSL_DISTRO_NAME: string;
	export const COLOR: string;
	export const WAYLAND_DISPLAY: string;
	export const npm_config_audit: string;
	export const LOGNAME: string;
	export const NAME: string;
	export const PULSE_SERVER: string;
	export const WSL_INTEROP: string;
	export const npm_config_prefix: string;
	export const npm_config_npm_version: string;
	export const TERM: string;
	export const _tide_color_truncated_dirs: string;
	export const _tide_prompt_and_frame_color: string;
	export const npm_config_cache: string;
	export const npm_config_node_gyp: string;
	export const PATH: string;
	export const NODE: string;
	export const npm_package_name: string;
	export const WT_SESSION: string;
	export const XDG_RUNTIME_DIR: string;
	export const PROJECT_HOME: string;
	export const DISPLAY: string;
	export const LANG: string;
	export const LS_COLORS: string;
	export const npm_config_loglevel: string;
	export const npm_config_fund: string;
	export const npm_lifecycle_script: string;
	export const SHELL: string;
	export const npm_config_access: string;
	export const npm_package_version: string;
	export const npm_lifecycle_event: string;
	export const EVIDENCE_DATA_URL_PREFIX: string;
	export const BASH_ENV: string;
	export const npm_config_globalconfig: string;
	export const npm_config_init_module: string;
	export const PWD: string;
	export const GPG_TTY: string;
	export const npm_execpath: string;
	export const _tide_reset_to_color_dirs: string;
	export const XDG_DATA_DIRS: string;
	export const npm_config_global_prefix: string;
	export const npm_package_engines_npm: string;
	export const npm_command: string;
	export const HOSTTYPE: string;
	export const WSL2_GUI_APPS_ENABLED: string;
	export const WSLENV: string;
	export const INIT_CWD: string;
	export const EDITOR: string;
	export const EVIDENCE_DATA_DIR: string;
	export const NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://kit.svelte.dev/docs/modules#$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://kit.svelte.dev/docs/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://kit.svelte.dev/docs/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		_tide_location_color: string;
		USER: string;
		WORKON_HOME: string;
		npm_config_user_agent: string;
		BUN_INSTALL: string;
		npm_node_execpath: string;
		SHLVL: string;
		WT_PROFILE_ID: string;
		npm_config_noproxy: string;
		HOME: string;
		npm_package_json: string;
		npm_package_engines_node: string;
		nvm_current_version: string;
		_tide_color_anchors: string;
		npm_config_userconfig: string;
		npm_config_local_prefix: string;
		GOROOT: string;
		DBUS_SESSION_BUS_ADDRESS: string;
		WSL_DISTRO_NAME: string;
		COLOR: string;
		WAYLAND_DISPLAY: string;
		npm_config_audit: string;
		LOGNAME: string;
		NAME: string;
		PULSE_SERVER: string;
		WSL_INTEROP: string;
		npm_config_prefix: string;
		npm_config_npm_version: string;
		TERM: string;
		_tide_color_truncated_dirs: string;
		_tide_prompt_and_frame_color: string;
		npm_config_cache: string;
		npm_config_node_gyp: string;
		PATH: string;
		NODE: string;
		npm_package_name: string;
		WT_SESSION: string;
		XDG_RUNTIME_DIR: string;
		PROJECT_HOME: string;
		DISPLAY: string;
		LANG: string;
		LS_COLORS: string;
		npm_config_loglevel: string;
		npm_config_fund: string;
		npm_lifecycle_script: string;
		SHELL: string;
		npm_config_access: string;
		npm_package_version: string;
		npm_lifecycle_event: string;
		EVIDENCE_DATA_URL_PREFIX: string;
		BASH_ENV: string;
		npm_config_globalconfig: string;
		npm_config_init_module: string;
		PWD: string;
		GPG_TTY: string;
		npm_execpath: string;
		_tide_reset_to_color_dirs: string;
		XDG_DATA_DIRS: string;
		npm_config_global_prefix: string;
		npm_package_engines_npm: string;
		npm_command: string;
		HOSTTYPE: string;
		WSL2_GUI_APPS_ENABLED: string;
		WSLENV: string;
		INIT_CWD: string;
		EDITOR: string;
		EVIDENCE_DATA_DIR: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
