import defaultsDeep from 'lodash/defaultsDeep.js';
import { getEvidenceConfig } from '@evidence-dev/sdk/config';

import { ThemesConfigFileSchema } from './schemas.js';
import { defaultThemes } from './defaultThemes.js';

/** @typedef {import('./schemas.js').Themes} Themes */

/** @returns {Themes} */
export const loadThemes = () => {
	let themesFromConfig = {};
	try {
		themesFromConfig = getEvidenceConfig(ThemesConfigFileSchema).themes;
	} catch {
		// Do nothing
	}
	const themes = defaultsDeep(themesFromConfig, defaultThemes);
	return themes;
};
