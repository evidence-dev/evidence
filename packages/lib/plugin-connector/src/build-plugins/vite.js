import { queryDirectoryHmr } from './query-directory-hmr.js';

/** @type {() => import("vite").UserConfig["plugins"]} */
export const evidenceVitePlugin = () => {
	return [queryDirectoryHmr];
};
