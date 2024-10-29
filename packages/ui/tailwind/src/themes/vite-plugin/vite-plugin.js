import { loadThemesConfig } from '../loadThemesConfig.js';
import { buildThemes } from '../buildThemes.js';

/** @returns {import('vite').Plugin} */
export const evidenceThemes = () => {
	const virtualModuleId = '$evidence/themes';
	const resolvedVirtualModuleId = `\0${virtualModuleId}`;

	return {
		name: 'evidence:themes',
		resolveId: (id) => {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},
		load: async (id) => {
			if (id === resolvedVirtualModuleId) {
				const themesConfig = await loadThemesConfig();
				const themes = buildThemes(themesConfig);
				// /** @satisfies {import('@evidence-dev/tailwind').ThemesConfig} */
				// /** @satisfies {import('@evidence-dev/tailwind').Themes}
				return `
					export const themesConfig = ${JSON.stringify(themesConfig)};
					export const themes = ${JSON.stringify(themes)};
				`;
			}
		}
	};
};
