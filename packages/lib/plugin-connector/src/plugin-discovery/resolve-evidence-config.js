import { isValidPackage } from './is-valid-package';
import { loadConfig } from './load-config';
import { findPluginDirectory } from './find-plugin-directory.js';

/**
 * Validates that the given package name exists and is a valid plugin package
 * @param {string} packageName
 * @returns {Promise<EvidencePluginPackage<ValidPackage> | false>}
 */
const validatePlugin = async (packageName) => {
	const packagePath = findPluginDirectory(packageName);

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
		Object.keys(configContent.components).map(validatePlugin)
	).then((pack) => /** @type {Exclude<typeof pack[number], false>[]} */ (pack.filter(Boolean)));

	/** @type {EvidencePluginPackage<EvidenceDatasourcePackage>[]} */
	const datasourcePackages = await Promise.all(
		Object.keys(configContent.datasources).map(validatePlugin)
	).then(
		(pack) =>
			/** @type {EvidencePluginPackage<EvidenceDatasourcePackage>[]} */
			(pack.filter((p) => p && Boolean(p.package.evidence?.datasources)))
	);

	return {
		components: componentPackages,
		datasources: datasourcePackages
	};
};
