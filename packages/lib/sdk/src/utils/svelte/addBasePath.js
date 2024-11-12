const ignoredStarts = ['http', '#', 'mailto'];

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
	if (ignoredStarts.some((start) => path.startsWith(start))) return path;

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
