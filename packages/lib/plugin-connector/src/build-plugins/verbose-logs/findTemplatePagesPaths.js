import fs from 'fs';
import path from 'path';
/**
 * Recursively finds template pages in a given directory and saves their paths to a set.
 * @param {string} directoryPath
 * @returns {Promise<Set<string>>} Set containing paths to template pages
 */
export const findTemplatePagesPaths = async (directoryPath) => {
	const templatePagePaths = new Set();
	const files = await fs.promises.readdir(directoryPath);

	for (const file of files) {
		const filePath = path.join(directoryPath, file);
		const fileStat = await fs.promises.stat(filePath);

		if (fileStat.isDirectory()) {
			const nestedTemplatePagePaths = await findTemplatePagesPaths(filePath);
			nestedTemplatePagePaths.forEach((absolutePath) => templatePagePaths.add(absolutePath));
		} else if (file.match(/^\[(.*?)\]\.md$/)) {
			templatePagePaths.add(filePath);
		}
	}

	return templatePagePaths;
};
