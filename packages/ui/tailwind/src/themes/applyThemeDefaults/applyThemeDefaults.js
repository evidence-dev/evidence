import merge from 'lodash/merge.js';
import mergeWith from 'lodash/mergeWith.js';
import { defaultThemesConfigFile } from './defaultThemesConfigFile.js';
import { computeShades } from './computeShades.js';

/**
 * @param {import('../../schemas/types.js').ThemesConfigFile} configFile
 * @returns {import('../../schemas/types.js').ThemesConfig}
 */
export const applyThemeDefaults = (configFile) => {
	/** @satisfies {typeof defaultThemesConfigFile} */
	const withDefaults = mergeWith({}, defaultThemesConfigFile, configFile, (_, configValue) => {
		// Don't merge arrays - prevents merging users defined color palette with our defaults
		if (Array.isArray(configValue) && configValue.length) {
			return configValue;
		}
	});
	const computedColors = computeShades(withDefaults.theme.colors);
	merge(withDefaults.theme.colors, computedColors);
	return /** @type {import('../../schemas/types.js').ThemesConfig} */ (withDefaults);
};
