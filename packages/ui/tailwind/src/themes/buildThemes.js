/**
 * @param {import('./types.js').ThemesConfig} themesConfig
 * @returns {import('./types.js').Themes}
 */
export const buildThemes = (themesConfig) =>
	Object.entries(themesConfig.themes.colors).reduce(
		(acc, [name, values]) => {
			if (!values) return acc;
			acc.light.colors[name] = values.light;
			acc.dark.colors[name] = values.dark;
			return acc;
		},
		/** @type {import('./types.js').Themes} */ ({ light: { colors: {} }, dark: { colors: {} } })
	);
