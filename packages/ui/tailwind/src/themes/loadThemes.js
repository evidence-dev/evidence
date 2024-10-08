import defaultsDeep from 'lodash/defaultsDeep.js';
import { getEvidenceConfig } from '@evidence-dev/sdk/config';

import { ThemesConfigFileSchema } from './schemas.js';
import { defaultThemes } from './defaultThemes.js';

/** @returns {import('./schemas.js').Themes} */
export const loadThemes = () => {
	const { themes: themesFromConfig } = getEvidenceConfig(ThemesConfigFileSchema);
	const themes = defaultsDeep(themesFromConfig, defaultThemes);
	return themes;
};
