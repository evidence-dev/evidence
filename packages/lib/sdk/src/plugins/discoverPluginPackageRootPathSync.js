import path from 'path';
import { createRequire } from 'module';
import fs from 'fs';
import { log } from '../logger/index.js';
import chalk from 'chalk';

/**
 *
 * @param {string} packageName
 * @returns {string|null}
 */
export const discoverPluginPackageRootPathSync = (packageName) => {
	// note: this will return the directory of the package entrypoint, eg: `some-package/dist/index.js`
	//       so we need to walk up the tree until we find a `package.json` file to discover the root.
	let pluginPackageDirectory = path.dirname(createRequire(import.meta.url).resolve(packageName));
	let pluginPackageDirContents = fs.readdirSync(pluginPackageDirectory);
	while (!pluginPackageDirContents.includes('package.json')) {
		pluginPackageDirectory = path.dirname(pluginPackageDirectory);
		pluginPackageDirContents = fs.readdirSync(pluginPackageDirectory);
	}

	if (pluginPackageDirectory === path.dirname(pluginPackageDirectory)) {
		// reached root
		log.warn(
			chalk.yellow(
				`Package ${chalk.bold(
					`"${packageName}"`
				)} not found, run again with --debug for more information`
			)
		);
		return null;
	}

	return pluginPackageDirectory;
};
