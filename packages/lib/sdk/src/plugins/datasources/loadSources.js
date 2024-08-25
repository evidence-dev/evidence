import path from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';
import { loadSourceConfig } from './loadSourceConfig.js';
import { sourcesDirectory } from '../../lib/projectPaths.js';

/** @typedef {import("./types.js").DatasourceSpec} DatasourceSpec */

/**
 * @param {string} sourcePath
 */
const loadSource = async (sourcePath) => {
	const isDir = await fs.stat(sourcePath).then((stat) => stat.isDirectory());
	if (!isDir) {
		console.debug(
			chalk.dim.yellow(`Source @ ${path.relative(process.cwd(), sourcePath)} is not a directory!`)
		);
		return false;
	}
	return loadSourceConfig(sourcePath);
};
/**
 * @returns {Promise<Array<DatasourceSpec>>}
 */
export const loadSources = async () => {
	const sourceDirs = await fs
		.readdir(sourcesDirectory)
		.then((dirs) => dirs.map((dir) => path.join(sourcesDirectory, dir)));

	return /** @type {Array<DatasourceSpec>}*/ (
		await Promise.all(
			sourceDirs.map(async (dir) => ({
				dir,
				...(await loadSource(dir))
			}))
		).then((sources) => sources.filter((source) => Boolean(source.name)))
	);
};
