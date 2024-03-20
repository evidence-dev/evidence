import { findFile } from 'pkg-types';
import fs from 'fs/promises';

/**
 * @param {string} dirname
 * @returns {Promise<string>}
 */
export const findDirectory = (dirname) => {
	return findFile(dirname, {
		test: (filename) =>
			fs
				.stat(filename)
				.then((stat) => stat.isDirectory())
				.catch(() => false)
	});
};
