export * from './inputs.js';
import { buildUrl as _buildUrl } from './buildUrl.js';
import { config } from '$evidence/config';
/** @type {(path: string) => string} */
export const buildUrl = (path) => {
	if (import.meta.env.DEV && import.meta.env.MODE !== 'test') return path;
	return _buildUrl(path, config);
};
