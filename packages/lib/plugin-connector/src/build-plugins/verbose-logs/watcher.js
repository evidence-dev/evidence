import path from 'path';
import chokidar from 'chokidar';
import { waitForDirectoryCreation } from './wait-creation.js';

/**
 * Calculates the depth of a directory path
 * @param {string} dirPath - The directory path
 * @returns {number}
 */
function calculateDepth(dirPath) {
	const segments = dirPath.split(path.sep).filter((segment) => segment !== '');
	if (segments.length === 0) {
		return 0;
	}
	return segments.length - 1;
}

/**
 * Calculate the max depth among an array of directory paths
 * @param {string[]} dirPaths
 * @returns {number} - The highest depth
 */
function getMaxDepth(dirPaths) {
	let maxDepth = -1;

	for (const dirPath of dirPaths) {
		const depth = calculateDepth(dirPath);
		if (depth > maxDepth) {
			maxDepth = depth;
		}
	}

	return maxDepth;
}

/**
 * Watches a directory and calculates the progress of files being added.
 * @param {string} directoryPath - The path to the directory to watch.
 * @param {Set<string>} dirs - The set of directories to watch.
 */
export async function watchDirectory(directoryPath, dirs) {
	/**
	 * @type {string | number | NodeJS.Timeout | undefined}
	 */
	let timeout;
	/**
	 * @type {string | number | NodeJS.Timeout | undefined}
	 */

	/**
	 * @type {number}
	 */
	let totalCount = 0;

	/**
	 * @type {chokidar.FSWatcher | undefined}
	 */
	let watcher;

	let done = false;
	await waitForDirectoryCreation(directoryPath);
	try {
		const pathArrays = Array.from(dirs).map((p) => {
			const pathArray = p.split(path.sep);
			pathArray.pop(); // removing the template page name
			return pathArray.slice(3); // removing target dir top paths
		});
		const joinedPaths = pathArrays.map((p) => path.sep + path.join(...p));
		const depth = getMaxDepth(joinedPaths);
		watcher = chokidar.watch(directoryPath, { ignoreInitial: true, depth: depth + 1 });

		// To trigger set the done state after 60 seconds of inactivity.
		const resetTimeout = () => {
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				watcher && watcher.close();
				done = true;
			}, 60000);
		};

		/**
		 * Sometimes, plugins runs again after the pages have been built.
		 * If this happens, the watcher may not register any changes, and the "done" state will never be true,
		 * even after the pages have been built. Hence setting up the timer before the watcher as well.
		 */
		resetTimeout();
		watcher.on('addDir', async () => {
			resetTimeout();
			totalCount++;
			console.clear(); // to clear the terminal and not fill the terminal with too many logs
			console.log('\u001b[1m\u001b[34m Building template pages: %d+\u001b[0m', totalCount);
			console.log('Please wait...');

			if (done && watcher) {
				watcher.close();
				console.log('closing watcher', done);
				return;
			}
		});
	} catch (err) {
		console.error('Error:', err);
		return;
	}
}
