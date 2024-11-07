export * from './inputs.js';
import { addBasePath as _addBasePath } from './addBasePath.js';
import { config } from '$evidence/config';
/** @type {(path: string) => string} */
export const addBasePath = (path) => {
	if (import.meta.env.DEV && import.meta.env.MODE !== 'test') return path;
	return _addBasePath(path, config);
};
