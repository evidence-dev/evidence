import defaultsDeep from 'lodash/defaultsDeep.js';
import { getEvidenceConfig } from '@evidence-dev/sdk/config';

import { ThemesConfigFileSchema } from '../schemas/config.js';
import { defaultThemesConfig } from '../themes/defaultThemesConfig.js';

/** @returns {import('../schemas/types.js').ThemesConfig} */
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
