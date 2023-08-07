import { isValidPackage } from './is-valid-package';
import path from 'path';
import { loadConfig } from './load-config';
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
	const configContent = loadConfig(rootDir);

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
