/**
 * @param {import('./schemas/types.js').ThemesConfig} themesConfig
 * @returns {import('./schemas/types.js').Themes}
 */
export const buildThemes = (themesConfig) =>
	/** @type {const} */ (['colors', 'colorPalettes', 'colorScales']).reduce(
		(acc, key) => {
			Object.entries(themesConfig.themes[key]).forEach(([name, values]) => {
				if (!values) return;
				acc.light[key][name] = values.light;
				acc.dark[key][name] = values.dark;
			});
			return acc;
		},
		/** @type {import('./schemas/types.js').Themes} */ ({
			light: { colors: {}, colorPalettes: {}, colorScales: {} },
			dark: { colors: {}, colorPalettes: {}, colorScales: {} }
		})
	);
