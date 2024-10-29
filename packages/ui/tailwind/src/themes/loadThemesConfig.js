import defaultsDeep from 'lodash/defaultsDeep.js';
import { getEvidenceConfig } from '@evidence-dev/sdk/config';

import { ThemesConfigFileSchema } from './schemas.js';
import { defaultThemesConfig } from './defaultThemesConfig.js';

/** @returns {import('./types.js').ThemesConfig} */
export const loadThemesConfig = () => {
	let fromEvidenceConfig = {};
	try {
		fromEvidenceConfig = getEvidenceConfig(ThemesConfigFileSchema);
	} catch {
		// Do nothing
	}
	const themesConfig = defaultsDeep(fromEvidenceConfig, defaultThemesConfig);
	return themesConfig;
};
