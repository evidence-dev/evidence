import { logger } from '../../shims/logger';

/**
 * Resolve a value from a pair of attributes where one has been renamed and the
 * other is a deprecated alias. Prefers the new name; falls back to the alias.
 * When only the deprecated alias is set, emits a one-shot dev-mode console
 * warning nudging authors to the new name — safe to call inside `$derived`
 * because a module-level `Set` dedupes repeat warnings for the same
 * `(component, deprecatedName)` pair across re-renders.
 *
 * Never throws. Never emits in production; the warning is behind an `import.meta.env.DEV`
 * check and disappears from bundled output.
 */
const warnedPairs = new Set<string>();

export function resolveDeprecatedAttribute<T>(params: {
	preferred: T | undefined;
	deprecated: T | undefined;
	preferredName: string;
	deprecatedName: string;
	componentName: string;
}): T | undefined {
	const { preferred, deprecated, preferredName, deprecatedName, componentName } = params;
	if (preferred !== undefined) return preferred;
	if (deprecated !== undefined) {
		// import.meta.env is Vite-only; guard so the fn stays usable in plain
		// Node contexts (tests, SSR). `process.env.NODE_ENV` covers those.
		const isDev =
			(typeof import.meta !== 'undefined' && (import.meta as { env?: { DEV?: boolean } }).env?.DEV) ||
			(typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production');
		if (isDev) {
			const key = `${componentName}:${deprecatedName}`;
			if (!warnedPairs.has(key)) {
				warnedPairs.add(key);
				logger.warn(
					`[${componentName}] "${deprecatedName}" is deprecated; use "${preferredName}" instead.`
				);
			}
		}
		return deprecated;
	}
	return undefined;
}
