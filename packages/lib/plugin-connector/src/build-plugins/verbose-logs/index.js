import { findTemplatePagesPaths } from './findTemplatePagesPaths.js';
import { watchDirectory } from './watcher.js';

/**
 * Crawls the pages dir and checks for the total no. of md files.
 * Then crawls the built pages in .evidence and checks for the dirs
 * Compares and shows percentage complete logs.
 * @type {import("vite").Plugin}
 */
export const verboseLogs = {
	name: 'evidence:verbose-logs',

	buildStart() {
		const directoryPath = '.svelte-kit/output/prerendered/pages';
		findTemplatePagesPaths('../../pages')
			.then((dirs) => {
				watchDirectory(directoryPath, dirs);
			})
			.catch((error) => {
				console.error('Error:', error);
			});
	}
};
