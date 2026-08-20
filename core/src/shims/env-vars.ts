/**
 * Mock for SvelteKit's $env/static/public and $env/dynamic/private modules.
 * Used in test environments where SvelteKit is not available.
 * All env vars return empty strings by default.
 */
export default new Proxy(
	{},
	{
		get(_target, prop) {
			if (typeof prop === 'string') return '';
			return undefined;
		}
	}
);
