/**
 * Adjusts a path to include the configured base path
 * Ignores undefined, and absolute URLs
 * @template T
 * @param {T} path
 * @param {import("../../configuration/schemas/config.schema.js").EvidenceConfig} config
 * @example addBasePath('http://localhost:3000/test') // 'http://localhost:3000/test'
 * @example addBasePath('/test') // '/base/test'
 * @example addBasePath(undefined) // undefined
 *
 * @returns {T | string}
 */
export const addBasePath = (path, config) => {
	/** @type {string} */
	let _path;

	if (path instanceof String) {
		_path = path.toString();
	} else if (typeof path !== 'string') {
		return path;
	} else {
		_path = path;
	}

	if (_path.startsWith('http')) return _path;
	if (_path.startsWith('#')) return _path; // ignore hash links
	if (/^[^/]*:/.test(_path)) return _path; // ignore other protocols

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
			_path = `/${path}`;
		}
		return `${basePath}${path}`;
	} else {
		return path;
	}
};
