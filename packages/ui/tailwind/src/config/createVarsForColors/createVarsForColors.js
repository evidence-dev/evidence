import plugin from 'tailwindcss/plugin.js';

/** @param {import('../../schemas/types.js').Themes} themes */
export const createVarsForColors = (themes) =>
	plugin((creator) => {
		const { addUtilities } = creator;
		const utilities = Object.entries(themes).reduce((acc, [themeName, theme]) => {
			acc[`html[data-theme="${themeName}"]`] = Object.entries(theme.colors).reduce(
				(acc, [name, value]) => {
					if (value) acc[`--${name}`] = value;
					return acc;
				},
				/** @type {Record<string, string>} */ ({})
			);
			return acc;
		}, /** @type {Record<string, Record<string, string>>} */ ({}));
		addUtilities(utilities);
	});
