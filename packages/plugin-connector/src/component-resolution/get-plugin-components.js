import { discoverEvidencePlugins } from '../plugin-discovery';
import { getComponentsForPackage } from './get-components-for-package';
import { loadConfig } from '../plugin-discovery/resolve-evidence-config';
import { getRootModules } from '../plugin-discovery/get-root-modules';
import chalk from 'chalk';
import { findSvelteComponents } from './loaders/file-loader';
import fs from 'fs';
import path from 'path';

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
					throw new Error('Invalid evidence.plugins.yaml');
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

				const alias = packageConfig.aliases[component];

				if (alias) {
					componentObj.aliasOf = component;
				}

				const componentOutputName = alias ?? component;

				if (acc[componentOutputName] && !packageConfig.overrides.includes(componentOutputName)) {
					console.warn(
						chalk.yellow(
							`[!] ${packageName} and ${acc[componentOutputName].package} both provide ${componentOutputName}. ${acc[componentOutputName].package} will be used, to use ${packageName}, specify an alias or explicit override. (https://docs.evidence.dev/plugins#component-aliases)`
						)
					);
					return acc;
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

	if (fs.existsSync(`${rootDir}/components`)) {
		const user_components = await findSvelteComponents(`${rootDir}/components`);
		for (const component_file of user_components) {
			const component = path.basename(component_file, '.svelte');
			if (componentMap[component]) {
				console.warn(
					chalk.yellow(
						`[!] The components folder and ${componentMap[component].package} both provide ${component}. The component from the components folder will be used. To use the component from ${componentMap[component].package}, specify an alias (https://docs.evidence.dev/plugins/using-plugins/#component-aliases) or explicitly import the component.`
					)
				);
				delete componentMap[component];
			}
		}
	}

	return componentMap;
}
