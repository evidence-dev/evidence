import chalk from 'chalk';
import fs from 'fs/promises';
import yaml from 'yaml';
import { EvidenceConfigSchema } from './schemas/evidence-config.schema';
import { isValidPackage } from './is-valid-package';
import { cleanZodErrors } from '../lib/clean-zod-errors';
import path from 'path';

/**
 *
 * @param {string} rootDir
 * @returns {Promise<EvidenceConfig>}
 */
export const loadConfig = async (rootDir) => {
	const configPath = `${rootDir}/evidence.plugins.yaml`;
	try {
		const configFileContent = await fs.readFile(configPath, 'utf8').then((r) => r.toString());
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

/**
 * Wrapper function to create a package validator function
 * @param {string} rootDir
 * @returns {(packageName: string) => Promise<EvidencePluginPackage<ValidPackage> | false>}
 */
const validatePlugin =
	(rootDir) =>
	/**
	 * Validates that the given package name exists and is a valid plugin package
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
		Object.keys(configContent.components).map(validatePlugin(rootDir))
	).then((pack) => /** @type {Exclude<typeof pack[number], false>[]} */ (pack.filter(Boolean)));

	/** @type {EvidencePluginPackage<EvidenceDatabasePackage>[]} */
	const databasePackages = await Promise.all(
		Object.keys(configContent.databases).map(validatePlugin(rootDir))
	).then(
		(pack) =>
			/** @type {EvidencePluginPackage<EvidenceDatabasePackage>[]} */
			(pack.filter((p) => p && Boolean(p.package.evidence?.databases)))
	);

	return {
		components: componentPackages,
		databases: databasePackages
	};
};
