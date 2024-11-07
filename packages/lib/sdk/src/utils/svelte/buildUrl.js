/**
 * Adjusts a path to include the configured base path
 * Ignores undefined, and absolute URLs
 * @param {string} path
 * @param {import("../../configuration/schemas/config.schema.js").EvidenceConfig} config
 * @example buildUrl('http://localhost:3000/test') // 'http://localhost:3000/test'
 * @example buildUrl('/test') // '/base/test'
 * @example buildUrl(undefined) // undefined
 *
 * @returns
 */
export const buildUrl = (path, config) => {
	if (path === undefined) return path;
	if (path.startsWith('http')) return path;
	if (path.startsWith('#')) return path; // ignore hash links

	let basePath = config.deployment.basePath;
	if (basePath) {
		if (!basePath?.startsWith('/')) {
			basePath = `/${basePath}`;
		}
		if (basePath.endsWith('/')) {
			basePath = basePath.slice(0, -1);
		}
		if (path.startsWith(basePath)) return path;
		return `${basePath}${path}`;
	} else {
		return path;
	}
};
