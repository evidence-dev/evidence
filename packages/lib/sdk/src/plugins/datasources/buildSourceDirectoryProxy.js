import fs from 'fs/promises';
import path from 'path';

/**
 * @param {string} directory
 * @returns {Promise<import("./types.js").SourceDirectory>}
 */
export const buildSourceDirectoryProxy = async (directory) => {
	/** @type {import("./types.js").SourceDirectory} */
	const output = {};

	for (const f of await fs.readdir(directory, { withFileTypes: true })) {
		if (f.isDirectory()) {
			output[f.name] = await buildSourceDirectoryProxy(path.join(directory, f.name));
		} else {
			output[f.name] = () => fs.readFile(path.join(directory, f.name), { encoding: 'utf-8' });
		}
	}

	return output;
};
