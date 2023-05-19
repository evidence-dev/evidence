import chalk from 'chalk';
import fs from 'fs/promises';
import yaml from 'yaml';
import { EvidenceConfigSchema } from './schemas/evidence-config.schema';
import { isValidPackage } from './is-valid-package';
import { cleanZodErrors } from '../lib/clean-zod-errors';
import path from 'path';

/** @type {EvidenceConfig} */
const emptyConfig = { components: {} };

/**
 *
 * @param {string} rootDir
 * @returns {Promise<EvidenceConfig>}
 */
export const loadConfig = async (rootDir) => {
	const configPath = `${rootDir}/evidence.plugins.yaml`;

	try {
		const configFileContent = await fs
			.readFile(configPath, 'utf8')
			.then((r) => r.toString())
			.then((s) => {
				// Surround all YAML key that begin with "@" in quotes
				// Skipping keys that are already quoted (e.g. beginning of line or whitespace)
				s = s.replaceAll(/($|\s)(@.+):/g, '$1"$2":');
				return yaml.parse(s);
			});
		const configResult = EvidenceConfigSchema.safeParse(configFileContent);
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

			return emptyConfig;
		}

		return configResult.data;
	} catch (e) {
		if (!(e instanceof Error)) throw e;
		if (e.message === 'ENOENT') {
			console.error(
				chalk.red.bold(
					`[!] evidence.plugins.yaml file not found in ${rootDir}.\n    This may lead to unexpected behavior.`
				)
			);
			return emptyConfig;
		}
		throw e;
	}
};

/**
 * Leverages evidence.plugins.yaml to resolve plugins
 * @param {string} rootDir
 * @returns {Promise<PackageDiscoveryResult>}
 */
export const resolveEvidencePackages = async (rootDir) => {
	/** @type {EvidenceConfig} */
	const configContent = await loadConfig(rootDir);

	/** @type {EvidencePluginPackage<ValidPackage>[]} */
	const componentPackages = await Promise.all(
		Object.keys(configContent.components).map(
			/**
			 * @param {string} packageName
			 * @returns {Promise<EvidencePluginPackage<ValidPackage> | false>}
			 */
			async (packageName) => {
				const packagePath = path.resolve(rootDir, 'node_modules', packageName);
				const validPackage = await isValidPackage(packagePath);
				if (!validPackage) return false;
				return {
					package: validPackage,
					path: packagePath
				};
			}
		)
	).then((pack) => /** @type {Exclude<typeof pack[number], false>[]} */ (pack.filter(Boolean)));

	// configContent.components
	// const components = await getPluginComponents(configContent);
	return {
		components: componentPackages,
		databases: []
	};
};
