import { getEvidenceConfig } from '../../configuration/getEvidenceConfig.js';
import { loadPluginPackage } from '../loadPluginPackage.js';
import { isComponentPlugin } from '../schemas/plugin-package.schema.js';
import { validateOverrides } from './validateOverrides.js';

/** @typedef {import("../schemas/plugin-package.schema.js").ComponentPackage} ComponentPackage */
/**
 * @typedef {Object} ComponentInfo
 * @property {string} name
 * @property {ComponentPackage & {dir: string}} package
 * @property {NonNullable<import("../schemas/plugin-config.schema.js").PluginConfig["components"]>[string]} options
 */

/**
 *
 * @returns {Promise<ComponentInfo[]>}
 */
export const loadComponentPlugins = async () => {
	const { plugins, layout } = getEvidenceConfig();
	const allComponentPlugins = plugins.components ?? {};

	if (layout) {
		const layoutPlugin = await loadPluginPackage(layout);

		if (layoutPlugin && isComponentPlugin(layoutPlugin)) {
			// If the layout provides components, include them automatically
			allComponentPlugins[layout] = { overrides: [], provides: [], aliases: {} };
		}
	}

	/** @type {ComponentInfo[]} */
	const components = [];

	await Promise.all(
		Object.entries(allComponentPlugins).map(async ([name, spec]) => {
			const pack = await loadPluginPackage(name);
			// TODO: Is it actually useful to be able to manually specify a plugin
			// e.g. I load an arbitrary svelte lib and use the provides field
			if (!pack || !isComponentPlugin(pack)) return;

			components.push({ name, package: pack, options: spec });
		})
	);

	validateOverrides(components);

	return components;
};
