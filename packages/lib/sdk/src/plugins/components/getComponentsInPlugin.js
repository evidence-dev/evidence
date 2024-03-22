import path from 'path';
import fs from 'fs/promises';
import { fileLoader } from './loaders/file-loader.js';
import { manifestLoader } from './loaders/manifest-loader.js';

/**
 * @param {import("./loadComponentPlugins.js").ComponentInfo} plugin
 */
export const getComponentsInPlugin = async (plugin) => {
	/** @type {Set<string>} */
	const providedComponents = new Set();

	if (plugin.options.provides.length) {
		plugin.options.provides.forEach((c) => providedComponents.add(c));
	} else {
		const manifestPath = path.resolve(plugin.package.dir, 'evidence.manifest.yaml');
		const manifestExists = await fs
			.access(manifestPath)
			.then(() => true)
			.catch(() => false);
		if (manifestExists) {
			const manifestComponents = await manifestLoader(plugin.package.dir).catch(() => []);
			manifestComponents.forEach((c) => providedComponents.add(c));
		}

		const mainFilePath = path.parse(path.resolve(plugin.package.dir, plugin.package.main)).dir;

		const fileComponents = await fileLoader(mainFilePath);
		fileComponents.forEach((c) => providedComponents.add(c));
	}

	return providedComponents;
};
