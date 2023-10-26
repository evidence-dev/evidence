import { sourceQueryHMR } from './source-query-hmr.js';

/** @type {() => import("vite").UserConfig["plugins"]} */
export const evidenceVitePlugin = () => {
	return [sourceQueryHMR()];
};
