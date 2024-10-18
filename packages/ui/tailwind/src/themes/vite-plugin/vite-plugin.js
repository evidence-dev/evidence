import { loadThemes } from '../loadThemes.js';

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
				const themes = await loadThemes();
				return `export default ${JSON.stringify(themes)}`;
			}
		}
	};
};
