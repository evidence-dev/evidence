import defaultsDeep from 'lodash/defaultsDeep';
import { getEvidenceConfig } from '@evidence-dev/sdk/config';

import { ThemesConfigSchema } from './schemas';
import { defaultThemes } from './defaultThemes';

/** @returns {import('./schemas').Themes} */
export const loadThemes = () => {
	const { themes: themesFromConfig } = getEvidenceConfig(ThemesConfigSchema);
	const themes = defaultsDeep(themesFromConfig, defaultThemes);
	return themes;
};
