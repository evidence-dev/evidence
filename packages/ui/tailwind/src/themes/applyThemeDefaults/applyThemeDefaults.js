import defaultsDeep from 'lodash/defaultsDeep.js';
import { defaultThemesConfigFile } from './defaultThemesConfigFile.js';
import { computeShades } from './computeShades.js';

/**
 * @param {import('../../schemas/types.js').ThemesConfigFile} configFile
 * @returns {import('../../schemas/types.js').ThemesConfig}
 */
export const applyThemeDefaults = (configFile) => {
	const withDefaults = defaultsDeep({}, configFile, defaultThemesConfigFile);
	withDefaults.themes.colors = computeShades(withDefaults.themes.colors);
	return withDefaults;
};
