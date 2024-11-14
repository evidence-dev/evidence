import chalk from 'chalk';
import { PluginPackageSchema } from './schemas/plugin-package.schema.js';
import fs from 'fs/promises';
import { createRequire } from 'module';
import path from 'path';

/**
 *
 * @param {string} name
 * @returns {Promise<null | import("./schemas/plugin-package.schema.js").PluginPackage & {dir: string}>}
 */
export const loadPluginPackage = async (name) => {
	const pluginPackageDirectory = path.dirname(createRequire(import.meta.url).resolve(name));
	const packagePath = path.join(pluginPackageDirectory, 'package.json');

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
