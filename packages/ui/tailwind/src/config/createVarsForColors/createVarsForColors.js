import plugin from 'tailwindcss/plugin.js';


/** @param {import('../../schemas/types.js').Themes} themes */
export const createVarsForColors = (themes) => {
	/**
	 * This plugin works in 2 steps:
	 * 	1. Add to the Tailwind theme for each color key that we discover
	 *     - The value for these colors is var(--[color-name])
	 *  2. Set a CSS variable rule for each theme (e.g. light and dark) to respond to the html's class changing
	 */

	// Discover all colors in all themes
	/** @type {Record<string,string>} */
	const allColors = {};
	for (const theme of Object.values(themes)) {
		for (const color of Object.keys(theme.colors)) {
			allColors[color] = `var(--color-${color})`;
		}
	}

	return plugin(
		(creator) => {
			// Add the CSS variables
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
			// Add the colors to tailwind's configuration
			theme: {
				extend: {
					colors: allColors
				}
			},
			darkMode: ['class', 'theme-dark']
		}
	);
};
