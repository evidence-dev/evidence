import { discoverEvidencePlugins } from '../plugin-discovery';
import { getComponentsForPackage } from './get-components-for-package';
import { loadConfig } from '../plugin-discovery/resolve-evidence-config';
import { getRootModules } from '../plugin-discovery/get-root-modules';
import chalk from 'chalk';

/**
 * @param {EvidenceConfig} [cfg]
 * @param {PackageDiscoveryResult} [pluginDiscoveries] Optional: Pass in already discovered plugins
 * @returns {Promise<PluginComponents>}
 */
export async function getPluginComponents(cfg, pluginDiscoveries) {
	const rootDir = await getRootModules();

	const config = cfg ?? (await loadConfig(rootDir));

	if (!pluginDiscoveries) {
		pluginDiscoveries = await discoverEvidencePlugins();
	}

	// TODO: Ensure that there are no duplicate overrides
	// Load all the components
	const components = await Promise.all(
		pluginDiscoveries.components.map(
			/**
			 * @param {EvidencePluginPackage<ValidPackage>} pluginPackage
			 * @returns {Promise<[string, Set<string>]>}
			 */
			async (pluginPackage) => [
				pluginPackage.package.name,
				await getComponentsForPackage(
					rootDir,
					pluginPackage.path,
					config.components[pluginPackage.package.name]
				)
			]
		)
	);

	// Now we will smush all of this into Record<ComponentName, PackageName>
	const componentMap = components.reduce(
		/**
		 * @param {PluginComponents} acc
		 * @param {[string, Set<string>]} p
		 */
		(acc, [packageName, components]) => {
			/** @type {EvidenceComponentConfig} */
			const packageConfig = config.components[packageName];
			for (const component of components) {
				/** @type {PluginComponent} */
				const componentObj = { package: packageName };

				const [alias] =
					Object.entries(packageConfig.aliases).find(([, target]) => target === component) ?? [];

				if (alias) {
					componentObj.aliasOf = component;
				}

				const componentOutputName = alias ?? component;

				if (acc[componentOutputName]) {
					console.warn(
						chalk.yellow(
							`[!] ${acc[componentOutputName].package} already has a component ${componentOutputName}`
						)
					);
				}

				if (packageConfig.overrides?.includes(componentOutputName)) {
					componentObj.overriden = {
						package: acc[componentOutputName].package
					};
				}

				acc[componentOutputName] = componentObj;
			}
			return acc;
		},
		{}
	);

	return componentMap;
}
