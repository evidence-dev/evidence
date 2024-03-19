import * as sveltekit from './sveltekit.js';
import * as svelte from './svelte.js';

/**
 * @type {Record<string, { copyAll: (rootDir: string, rootTargetDir: string) => Promise<void>, copyFile: (rootDir: string, rootTargetDir: string, file: import("fs").Dirent) => void }>}
 */
export const copyMethods = {
	sveltekit: sveltekit,
	svelte: svelte
};
