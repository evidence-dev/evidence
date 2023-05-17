import { discoverEvidencePlugins } from '../plugin-discovery';
import { getComponentsForPackage } from './get-components-for-package';
import { loadConfig } from '../plugin-discovery/resolve-evidence-config';
import { getRootModules } from '../plugin-discovery/get-root-modules';

/**
 * @param {EvidenceConfig} config
 * @param {PackageDiscoveryResult} [pluginDiscoveries] Optional: Pass in already discovered plugins
 * @returns {Promise<PluginComponents>}
 */
export async function getPluginComponents(config, pluginDiscoveries) {
	const rootDir = await getRootModules();

	if (!config) {
		config = await loadConfig(rootDir);
	}

	if (!pluginDiscoveries) {
		pluginDiscoveries = await discoverEvidencePlugins();
	}

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
					pluginPackage.package.name,
					config.components[pluginPackage.package.name]
				)
			]
		)
	);
	const packageMap = Object.fromEntries(components);

	// Now we will smush all of this into Record<ComponentName, PackageName>
	const componentMap = Object.entries(packageMap).reduce(
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

				const [alias] = Object.entries(packageConfig?.aliases ?? {}).find(
					([, target]) => target === component
				) ?? [];

				if (alias) {
					componentObj.aliasOf = component;
				}

				if (alias) {
					acc[alias] = componentObj;
				} else {
					acc[component] = componentObj;
				}
			}
			return acc;
		},
		{}
	);

	return componentMap;
}
