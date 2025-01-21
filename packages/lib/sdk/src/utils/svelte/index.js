export * from './inputs.js';
import { addBasePath as _addBasePath } from './addBasePath.js';
import { config } from '$evidence/config';
/** @type {(path: string) => string} */
export const addBasePath = (path) => _addBasePath(path, config);
export { hydrateFromUrlParam, updateUrlParam } from "./useUrlParams.js"