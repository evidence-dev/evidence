import fs from 'fs/promises';
import chalk from 'chalk';
import path from 'path';
import yaml from 'yaml';
import { cleanZodErrors } from '../../lib/clean-zod-errors';
import { ComponentManifestSchema } from '../schemas/component-manifest.schema';

/**
 * @param {string} packagePath
 * @param {string} rootDir
 *
 * @returns {Promise<string[]>}
 */
export async function manifestLoader(packagePath, rootDir) {
	try {
		// Load Config
		const manifestContent = await fs
			.readFile(path.resolve(packagePath, 'evidence.manifest.yaml'))
			.then((r) => r.toString());
		// Parse YAML, then validate data
		const manifest = yaml.parse(manifestContent);
		const parsedManifest = ComponentManifestSchema.safeParse(manifest);

		if (!parsedManifest.success) {
			// Shape is wrong
			console.error(chalk.bold.red(`[!] evidence.manifest.yaml has errors`));
			const formattedError = cleanZodErrors(parsedManifest.error.format());
			console.error(chalk.red('|   Discovered Errors:'));
			const redPipe = chalk.red('|');
			console.error(
				`${redPipe}   ${yaml.stringify(formattedError).replace(/\n/g, `\n${redPipe}   `)}`
			);

			// TODO: How do we stop here? Do we need to throw here?
			throw new Error('Unable to load evidence manifest');
		}

		return parsedManifest.data.components;
	} catch (e) {
		if (!(e instanceof Error)) throw e;
		if (e.message === 'ENOENT') {
			console.error(
				chalk.red.bold(
					`[!] evidence.manifest.yaml file not found in ${rootDir}.\n    This is probably a bug in Evidence; please file a report at https://github.com/evidence-dev/evidence/issues/new?assignees=&labels=bug%2C+to-review&projects=&template=bug_report.md`
				)
			);
			throw e;
		}
		throw e;
	}
}
