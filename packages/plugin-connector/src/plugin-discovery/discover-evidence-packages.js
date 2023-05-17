import fs from 'fs/promises';
import { isValidPackage } from './is-valid-package';

/**
 * Traverses a node_modules directory.
 * Returns a set of qualified package names that have evidence in their package.json
 * @param {string} path
 * @returns {Promise<Set<{package: ValidPackage, path: string}>>}
 */
const traverse = async (path) => {
	/** @type {Set<{package: ValidPackage, path: string}>} */
	const output = new Set();

	// Iterate through node_modules
	for (const item of await fs.readdir(path)) {
		// Skip hidden files
		if (item.startsWith('.')) continue;
		const itemPath = `${path}/${item}`;

		// Folder contains organization / scoped moduless
		if (item.startsWith('@')) {
			const results = await traverse(itemPath);
			results.forEach((r) => {
				output.add({ ...r, path: `${item}/${r.package.name}` });
			});
			continue;
		}
		// Folder might be an evidence package
		const stat = await fs.stat(itemPath);
		if (stat.isDirectory()) {
			// First make sure it is a folder, then check if it is a plugin
			const packageContent = await isValidPackage(itemPath);
			if (packageContent) {
				output.add({ package: packageContent, path: item });
			}
		}
	}
	return output;
};

/**
 * Traverses node_modules to automatically discover evidence packages
 * Only includes first-level dependencies
 *
 * @deprecated Configuration based discovery should be preferred
 * @example
 * In package.json:
 * {
 *    ...,
 *    "evidence": {
 *       "components": true
 *    },
 *    ...
 * }
 *
 * @param {string} start
 * @returns {Promise<EvidencePluginPackage<ValidPackage>[]>}
 */
export const discoverEvidencePackages = async (start) => {
	const node_modules = `${start}/node_modules`;
	// We don't _really_ care about the result of this
	// This is just a naive way to see if the directory exists
	try {
		const r = await fs.stat(node_modules);
		if (!r.isDirectory()) throw new Error('notdir');
	} catch (e) {
		// This is funky undefined behavior, but types
		if (!(e instanceof Error)) throw e;

		if (e.message === 'notdir') {
			throw new Error(`${node_modules} is not a directory!`);
		}
		throw new Error(`${node_modules} does not exist!`);
	}
	// Node modules is now confirmed a directory; lets build a list of all packages
	const packages = await traverse(node_modules);
	return Array.from(packages);
};
