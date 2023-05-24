import { discoverEvidencePlugins } from '../plugin-discovery';
import { getComponentsForPackage } from './get-components-for-package';
import { loadConfig } from '../plugin-discovery/resolve-evidence-config';
import { getRootModules } from '../plugin-discovery/get-root-modules';
import chalk from 'chalk';

/**
 * @param {EvidenceConfig} [cfg]
 * @param {PackageDiscoveryResult} [discoveries] Optional: Pass in already discovered plugins
 * @returns {Promise<PluginComponents>}
 */
export async function getPluginComponents(cfg, discoveries) {
	const rootDir = await getRootModules();

	const config = cfg ?? (await loadConfig(rootDir));

	const pluginDiscoveries = discoveries ?? (await discoverEvidencePlugins());

	Object.values(config.components).reduce(
		/**
		 * @param {Set<string>} acc
		 * @param {EvidenceComponentConfig} v
		 */
		(acc, v) => {
			for (const override of v.overrides) {
				if (acc.has(override)) {
					console.error(
						chalk.red(
							`[!] ${override} is overriden more than once. Please ensure that a component is overriden only once.`
						)
					);
					throw new Error("Invalid evidence.plugins.yaml");
				}
				acc.add(override);
			}
			return acc;
		},
		new Set()
	);

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
					if (!acc[componentOutputName]) {
						console.warn(
							chalk.yellow(
								`[!] ${packageName} cannot override it's own component ${componentOutputName}`
							)
						);
					} else {
						componentObj.overriden = {
							package: acc[componentOutputName].package
						};
					}
				}

				acc[componentOutputName] = componentObj;
			}
			return acc;
		},
		{}
	);

	return componentMap;
}
