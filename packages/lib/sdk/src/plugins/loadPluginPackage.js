import chalk from 'chalk';
import { PluginPackageSchema } from './schemas/plugin-package.schema.js';
import fs from 'fs/promises';
import path from 'path';
import { projectRoot } from '../lib/projectRoot.js';

/**
 *
 * @param {string} name
 * @returns {Promise<null | import("./schemas/plugin-package.schema.js").PluginPackage & {dir: string}>}
 */
export const loadPluginPackage = async (name) => {
	// We have to use this instead of read/resolve PackageJSON because these packages don't have an index file
	const packagePath = path.join(projectRoot, 'node_modules', name, 'package.json');

	const packageContent = JSON.parse(await fs.readFile(packagePath, 'utf-8'));
	const pack = PluginPackageSchema.safeParse(packageContent);

	if (!pack.success) {
		// Invalid Plugin
		console.warn(
			chalk.yellow(
				`Datasource package ${chalk.bold(
					`"${name}"`
				)} is an invalid Evidence plugin, run again with --debug for more information`
			)
		);
		console.debug(pack.error.format());
		console.debug(JSON.stringify(packageContent, null, 1));
		return null;
	}

	if (!pack.data.main) {
		if (packageContent.svelte) pack.data.main = packageContent.svelte.toString();
		else if (packageContent.exports) {
			switch (typeof packageContent.exports) {
				case 'string':
					pack.data.main = packageContent.exports;
					break;
				case 'object': {
					if ('.' in packageContent.exports) {
						const e = packageContent.exports['.'];
						if (typeof e === 'string') pack.data.main = e;
						else pack.data.main = e.module ?? e.svelte;
					}
				}
			}
		}
	}

	return {
		...pack.data,
		dir: path.parse(packagePath).dir
	};
};
