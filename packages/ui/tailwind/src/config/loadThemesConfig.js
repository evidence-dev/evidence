import defaultsDeep from 'lodash/defaultsDeep.js';
import { getEvidenceConfig } from '@evidence-dev/sdk/config';

import { ThemesConfigFileSchema } from '../schemas/config.js';
import { defaultThemesConfig } from '../themes/defaultThemesConfig.js';
import { computeShades } from '../themes/computeShades.js';

/** @returns {import('../schemas/types.js').ThemesConfig} */
export const loadThemesConfig = () => {
	/** @type {import('../schemas/types.js').ThemesConfigFile} */
	let fromEvidenceConfig = {};
	try {
		fromEvidenceConfig = getEvidenceConfig(ThemesConfigFileSchema);
	} catch {
		// Do nothing
	}
	fromEvidenceConfig = computeShades(fromEvidenceConfig);
	const themesConfig = defaultsDeep({}, fromEvidenceConfig, defaultThemesConfig);
	return themesConfig;
};
