/**
 * Adjusts a path to include the configured base path
 * Ignores undefined, and absolute URLs
 * @param {string} path
 * @param {import("../../configuration/schemas/config.schema.js").EvidenceConfig} config
 * @example addBasePath('http://localhost:3000/test') // 'http://localhost:3000/test'
 * @example addBasePath('/test') // '/base/test'
 * @example addBasePath(undefined) // undefined
 *
 * @returns
 */
export const addBasePath = (path, config) => {
	if (path === undefined) return path;
	if (path.startsWith('http')) return path;
	if (path.startsWith('#')) return path; // ignore hash links
	if (/^[^/]*:/.test(path)) return path; // ignore other protocols

	let basePath = config.deployment.basePath;
	if (basePath) {
		if (!basePath?.startsWith('/')) {
			basePath = `/${basePath}`;
		}
		if (basePath.endsWith('/')) {
			basePath = basePath.slice(0, -1);
		}
		if (path.startsWith(basePath)) return path;
		if (!path.startsWith('/')) {
			path = `/${path}`;
		}
		return `${basePath}${path}`;
	} else {
		return path;
	}
};
