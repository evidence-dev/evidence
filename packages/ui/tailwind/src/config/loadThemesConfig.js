import { getEvidenceConfig } from '@evidence-dev/sdk/config';

import { ThemesConfigFileSchema } from '../schemas/config.js';
import { applyThemeDefaults } from '../themes/index.js';

/** @returns {import('../schemas/types.js').ThemesConfig} */
export const loadThemesConfig = () => {
	/** @type {import('../schemas/types.js').ThemesConfigFile} */
	let config = {};
	try {
		config = getEvidenceConfig(ThemesConfigFileSchema);
	} catch {
		// Do nothing
	}

	const out = applyThemeDefaults(config);
	console.log(JSON.stringify(out.themes.colors, null, 2));
	return out;
};
