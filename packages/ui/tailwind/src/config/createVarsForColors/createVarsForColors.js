import plugin from 'tailwindcss/plugin.js';

// @custom-variant dark (&:where(.theme-dark, .theme-dark *));
/** @param {import('../../schemas/types.js').Themes} themes */
export const createVarsForColors = (themes) => {
	/** @type {Record<string,string>} */
	const allColors = {};
	for (const theme of Object.values(themes)) {
		for (const color of Object.keys(theme.colors)) {
			allColors[color] = `var(--color-${color})`;
		}
	}

	return plugin(
		(creator) => {
			const utilities = Object.entries(themes).reduce((acc, [themeName, theme]) => {
				acc[`html.theme-${themeName}`] = Object.entries(theme.colors).reduce(
					(acc, [name, value]) => {
						if (value) acc[`--color-${name}`] = value;
						if (value) acc[`--${name}`] = value;
						return acc;
					},
					/** @type {Record<string, string>} */ ({})
				);
				return acc;
			}, /** @type {Record<string, Record<string, string>>} */ ({}));

			creator.addBase(utilities);
		},
		{
			theme: {
				extend: {
					colors: allColors
				}
			},
			darkMode: ['class', 'theme-dark']
		}
	);
};
