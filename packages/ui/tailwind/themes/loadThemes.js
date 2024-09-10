import { getEvidenceConfig } from '@evidence-dev/sdk/config';

import { ThemesConfigSchema } from './schemas';

/** @returns {import('./schemas').Themes} */
export const loadThemes = () => {
	// TODO apply default evidence themes
	const { themes } = getEvidenceConfig(ThemesConfigSchema);
	return themes;
};
