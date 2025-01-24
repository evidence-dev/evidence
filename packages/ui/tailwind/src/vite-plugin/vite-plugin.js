import { loadThemesConfig } from '../config/loadThemesConfig.js';
import { buildThemes } from '../themes/buildThemes.js';

/** @returns {import('vite').Plugin} */
export const evidenceThemes = () => {
	const virtualModuleId = '$evidence/themes';
	const resolvedVirtualModuleId = `\0${virtualModuleId}`;
	/** @type {ReturnType<typeof loadThemesConfig>} */
	let themesConfig;
	return {
		name: 'evidence:themes',
		resolveId: (id) => {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},
		load: async (id) => {
			if (id === resolvedVirtualModuleId) {
				if (!themesConfig) themesConfig = await loadThemesConfig();
				const themes = buildThemes(themesConfig);
				return `
					export const themesConfig = ${JSON.stringify(themesConfig)};
					export const themes = ${JSON.stringify(themes)};
				`;
			}
		}
	};
};
