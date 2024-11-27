import defaultsDeep from 'lodash/defaultsDeep.js';
import merge from 'lodash/merge.js';
import { defaultThemesConfigFile } from './defaultThemesConfigFile.js';
import { computeShades } from './computeShades.js';

/**
 * @param {import('../../schemas/types.js').ThemesConfigFile} configFile
 * @returns {import('../../schemas/types.js').ThemesConfig}
 */
export const applyThemeDefaults = (configFile) => {
	const withDefaults = defaultsDeep({}, configFile, defaultThemesConfigFile);
	const computedColors = computeShades(withDefaults.themes.colors);
	merge(withDefaults.themes.colors, computedColors);
	return withDefaults;
};
