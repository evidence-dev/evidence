import { getComponentsInPlugin } from './getComponentsInPlugin.js';
import { loadComponentPlugins } from './loadComponentPlugins.js';
import fs from 'fs';
import { findSvelteComponents } from './loaders/file-loader.js';
import path from 'path';
import chalk from 'chalk';

/**
 * @typedef {Object} ComponentResolution
 * @property {string} [aliasOf]
 */

export const getAllComponents = async () => {
	const plugins = await loadComponentPlugins();
	const allComponents = await Promise.all(
		plugins.map(
			/** @returns {Promise<[import("./loadComponentPlugins.js").ComponentInfo, Set<string>]>} */
			async (plugin) => [plugin, await getComponentsInPlugin(plugin)]
		)
	);

	const mappedComponents = allComponents.reduce(
		(
			/** @type {Record<string, import("./loadComponentPlugins.js").ComponentInfo & ComponentResolution>} */ c,
			[plugin, components]
		) => {
			for (const component of components) {
				let componentName = component;
				/** @type {import("./loadComponentPlugins.js").ComponentInfo & ComponentResolution} */
				const input = { ...plugin };

				// Handle aliasing logic
				const alias = plugin.options.aliases[component];
				if (alias) {
					input.aliasOf = component;
					componentName = alias;
				}

				// This component (or alias) has already been specified, and this package does not override it.
				if (c[componentName] && !plugin.options.overrides.includes(componentName)) {
					const existingPackage = c[componentName].package.name;
					console.warn(
						chalk.yellow(
							`[!] ${plugin.package.name} and ${existingPackage} both provide ${componentName}. ${existingPackage} will be used, to use ${plugin.package.name}, specify an alias or explicit override. (https://docs.evidence.dev/plugins#component-aliases)`
						)
					);
					// no-op
					return c;
				}

				c[componentName] = plugin;
			}
			return c;
		},
		{}
	);

	const rootDir = process.cwd();

	if (fs.existsSync(`${rootDir}/components`)) {
		const user_components = await findSvelteComponents(`${rootDir}/components`);
		for (const component_file of user_components) {
			const component = path.basename(component_file, '.svelte');
			if (mappedComponents[component]) {
				console.warn(
					chalk.yellow(
						[
							`${chalk.bold(
								`[!] The components folder and ${mappedComponents[component].package} both provide ${component}`
							)}.`,
							'The component from the components folder will be used.',
							`To use the component from ${mappedComponents[component].package}, specify an alias (https://docs.evidence.dev/plugins/using-plugins/#component-aliases) or explicitly import the component.`
						].join('\n\t')
					)
				);
				delete mappedComponents[component];
			}
		}
	}

	return mappedComponents;
};
