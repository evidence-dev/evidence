import path from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';
import { projectRoot } from '../../../lib/projectRoot.js';

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
	// TODO: Error handling
	if (!rootTargetDir.includes('(evidence-pages)'))
		rootTargetDir = path.join(rootTargetDir, '(evidence-pages)');
	await fs.mkdir(rootTargetDir, { recursive: true });

	const { relativePath } = await getTargets(rootDir, rootTargetDir, page);
	const p = path.parse(path.join(rootTargetDir, relativePath));
	const filename = page.name.split('.')[0]; // rip off the filename
	const extention = page.name.split('.').slice(1).join('.'); // rip off the filename
	const from = path.join(page.path, page.name);
	let to;
	if (page.name === '+layout.svelte') {
		to = path.join(p.dir, page.name);
	} else if (page.name.split('.')[0] === 'index') {
		to = path.join(p.dir, `+page.${extention}`);
	} else {
		// needs a dir
		// same as relative, excludes file extension
		const dirname = path.join(
			rootTargetDir,
			path.relative(path.resolve(projectRoot, 'pages'), path.resolve(page.path, filename))
		);
		await fs.mkdir(dirname, { recursive: true });
		to = path.join(dirname, `+page.${extention}`);
	}
	await fs.cp(from, to);
	console.debug(chalk.dim(`Copied ${from} -> ${to}`));
};

/**
 * @param {string} rootDir
 * @param {string} rootTargetDir
 */
export const copyAll = async (rootDir, rootTargetDir) => {
	rootTargetDir = path.join(rootTargetDir, '(evidence-pages)');
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
