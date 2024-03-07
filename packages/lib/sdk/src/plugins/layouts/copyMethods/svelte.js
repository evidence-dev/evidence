import path from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';

/**
 *
 * @param {string} rootDir
 * @param {string} rootTargetDir
 * @param {import("fs").Dirent} file
 */
const getTargets = async (rootDir, rootTargetDir, file) => {
	const relativePath = path.relative(path.resolve(rootDir), path.resolve(file.path, file.name));
	const absolutePath = path.join(rootTargetDir, relativePath);

	return {
		relativePath,
		absolutePath
	};
};

/**
 * @param {string} rootDir
 * @param {string} rootTargetDir
 * @param {import("fs").Dirent} page
 */
export const copyFile = async (rootDir, rootTargetDir, page) => {
	await fs.mkdir(rootTargetDir, { recursive: true });
	const { relativePath } = await getTargets(rootDir, rootTargetDir, page);
	const p = path.parse(path.join(rootTargetDir, relativePath));
	const from = path.join(page.path, page.name);
	let to = path.join(p.dir, page.name);
	await fs.cp(from, to);
	console.debug(chalk.dim(`Copied ${from} -> ${to}`));
};

/**
 * @param {string} rootDir
 * @param {string} rootTargetDir
 */
export const copyAll = async (rootDir, rootTargetDir) => {
	await fs.mkdir(rootTargetDir, { recursive: true });

	const pages = await fs.readdir(path.resolve(rootDir), { recursive: true, withFileTypes: true });

	for (const page of pages) {
		const { absolutePath } = await getTargets(rootDir, rootTargetDir, page);
		if (page.isDirectory()) {
			await fs.mkdir(absolutePath, { recursive: true });
		} else {
			await copyFile(rootDir, rootTargetDir, page);
		}
	}
};
