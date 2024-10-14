import { loadThemes } from './themes/loadThemes.js';

export const evidenceThemes = () => {
	console.log('executing evidenceThemes');
	const virtualModuleId = 'virtual:evidence-themes';
	const resolvedVirtualModuleId = `\0${virtualModuleId}`;

	return {
		name: 'evidence-themes',
		/** @param {string} id */
		resolveId: (id) => {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},
		/** @param {string} id */
		load: async (id) => {
			if (id === resolvedVirtualModuleId) {
				const themes = await loadThemes();
				return `export default ${JSON.stringify(themes)}`;
			}
		}
	};
};
