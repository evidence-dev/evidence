import { queryDirectoryHmr } from './query-directory-hmr.js';
import { sourceQueryHMR } from './source-query-hmr.js';
import { verboseLogs } from './verbose-logs/index.js';

/** @type {() => import("vite").UserConfig["plugins"]} */
export const evidenceVitePlugin = () => {
	return [sourceQueryHMR(), queryDirectoryHmr, verboseLogs];
};
