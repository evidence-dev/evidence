import path from 'path';
import { findDirectory } from '../../lib/pkg-types.helpers.js';
import fs from 'fs/promises';
import chalk from 'chalk';
import { loadSourceConfig } from './loadSourceConfig.js';

/**
 *
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
 * @returns {Promise<Array<import('./schemas/datasource.schema.js').DatasourceSpecFile & {dir: string}>>}
 */
export const loadSources = async () => {
	const sourceDir = await findDirectory('sources');
	const sourceDirs = await fs
		.readdir(sourceDir)
		.then((dirs) => dirs.map((dir) => path.join(sourceDir, dir)));

	return /** @type {Array<import('./schemas/datasource.schema.js').DatasourceSpecFile & {dir: string}>}*/ (
		await Promise.all(
			sourceDirs.map(async (dir) => ({
				dir,
				...(await loadSource(dir))
			}))
		).then((sources) => sources.filter((source) => Boolean(source.name)))
	);
};
