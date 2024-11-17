import { createRequire } from 'module';
import path from 'path';

/**
 *
 * @param {string} packageName
 * @returns {string}
 */
export const findPluginDirectory = (packageName) => {
	// TODO: it would probably be better to use findPackageJSON but only available in node ^23
	//       https://nodejs.org/api/module.html#modulefindpackagejsonspecifier-base
	const mainPackageExportFile = createRequire(import.meta.url).resolve(packageName);

	let packageRoot = mainPackageExportFile;

	const packageNamePath = packageName.replace('/', path.sep);

	while (packageRoot !== path.sep && packageRoot.endsWith(packageNamePath) === false) {
		packageRoot = path.dirname(packageRoot);
	}

	if (packageRoot.endsWith(packageName) === false) {
		throw new Error(
			`failed to find plugin package root for ${packageName}, export file ${mainPackageExportFile}`
		);
	}

	return packageRoot;
};
