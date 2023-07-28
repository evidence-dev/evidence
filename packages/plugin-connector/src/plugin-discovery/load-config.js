import { cleanZodErrors } from '../lib/clean-zod-errors';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import yaml from 'yaml';
import { EvidenceConfigSchema } from './schemas/evidence-config.schema';

/**
 * @param {string} rootDir
 * @returns {EvidenceConfig}
 */
export const loadConfig = (rootDir) => {
	const configPath = `${rootDir}/evidence.plugins.yaml`;
	try {
		const configFileContent = readFileSync(configPath, 'utf8').toString();
		// Surround all YAML key that begin with "@" in quotes
		// Skipping keys that are already quoted (e.g. beginning of line or whitespace)
		const rawConfig = yaml.parse(configFileContent.replaceAll(/($|\s)(@.+):/g, '$1"$2":'));

		const configResult = EvidenceConfigSchema.safeParse(rawConfig);
		if (!configResult.success) {
			console.error(
				chalk.bold.red(
					`[!] evidence.plugins.yaml does not contain a valid configuration. \n    Plugins will not be loaded. This may lead to unexpected behavior.`
				)
			);
			const formattedError = cleanZodErrors(configResult.error.format());
			console.error(chalk.red('|   Discovered Errors:'));
			const redPipe = chalk.red('|');
			console.error(
				`${redPipe}   ${yaml.stringify(formattedError).replace(/\n/g, `\n${redPipe}   `)}`
			);
			throw new Error('Invalid evidence.plugins.yaml');
		}

		return configResult.data;
	} catch (e) {
		if (!(e instanceof Error)) throw e;
		if (e.message.startsWith('ENOENT')) {
			console.warn('Could not find evidence plugins file. Using defaults.');
			return EvidenceConfigSchema.parse({
				components: {
					'@evidence-dev/core-components': {}
				}
			});
		}
		throw e;
	}
};