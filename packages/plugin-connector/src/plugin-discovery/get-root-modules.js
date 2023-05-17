import path from 'path';
import fs from 'fs/promises';

/**
 * @param {string} p
 * @returns {Promise<boolean>}
 */
const hasNodeModules = async (p) => {
	const directoryItems = await fs.readdir(p);
	return directoryItems.includes('node_modules');
};

/**
 * Attempts to find the highest, project-scoped node_modules filepath.
 * Note that this behavior _should_ remain the same regardless of where this is run from
 * Locally installed ("linked") packages and regularly installed packages should return the same value.
 * @param {string | undefined} [startingPoint]
 * @returns {Promise<string>}
 */
export const getRootModules = async (startingPoint) => {
	// Either use the entry file or a specific startingPoint
	const entryFile = startingPoint ?? process.cwd();
	// Split the entryfile path on "node_modules", this will help if the main file is nested
	// e.g. if sveltekit, main file will be node_modules/@sveltejs/kit/node_modules
	// node_modules/.pnpm/vite@4.0.4/node_modules/vite/bin/vite.js
	const parsedPath = path.parse(entryFile.split('/node_modules')[0]);
	let p = `${parsedPath.dir}/${parsedPath.base}`;
	const initP = p;
	const stat = await fs.stat(p);
	if (stat.isFile()) p = path.parse(p).dir;

	while (!(await hasNodeModules(p))) {
		if (p === path.parse(p).root) {
			throw new Error(`Could not locate node_modules! ${JSON.stringify({ startingPoint, initP })}`);
		}
		p = path.parse(p).dir;
	}

	return p;
};
