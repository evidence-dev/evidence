import { isValidPackage } from './is-valid-package';
import path from 'path';
import { loadConfig } from './load-config';
import { createRequire } from 'module';

/**
 *
 * @param {string} packageName
 * @returns {string}
 */
const findPluginDirectory = (packageName) => {
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
