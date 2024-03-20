import { EvidenceError } from '../../lib/EvidenceError.js';

/**
 * @param {import("./loadComponentPlugins.js").ComponentInfo[]} plugins
 * @returns {true}
 */
export const validateOverrides = (plugins) => {
	/** @type {Set<string>} */
	const overrides = new Set();

	/** @type {Record<string, string[]>} */
	const duplicates = {};
	for (const plugin of plugins) {
		for (const override of plugin.options.overrides) {
			if (overrides.has(override)) {
				if (!duplicates[override]) duplicates[override] = [];
				duplicates[override].push(plugin.name);
			}
			overrides.add(override);
		}
	}

	if (Object.keys(duplicates).length) {
		throw new EvidenceError(
			'Invalid component plugin configuration; some components are overriden more than once',
			...Object.entries(duplicates).map(([k, v]) => `${k}: Overridden by ${v.join(', ')}`)
		);
	}
	return true;
};
