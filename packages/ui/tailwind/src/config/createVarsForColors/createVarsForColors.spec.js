import { describe, it, expect } from 'vitest';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';

import { createVarsForColors } from './createVarsForColors';

const runPlugin = async (theme) => {
	const result = await postcss(
		tailwindcss({
			content: [{ raw: '' }],
			plugins: [createVarsForColors(theme)],
			safelist: ['theme-dark', 'theme-light']
		})
	)
		.process('@tailwind utilities')
		.async();
	console.log({ result });
	return result.css;
};

describe('createVarsForColors', () => {
	it('should create CSS variables on the html element based on the theme', async () => {
		/** @type {import('../types.js').Themes} */
		const themes = {
			light: { colors: { someColorToken: 'someColorValue-light' } },
			dark: { colors: { someColorToken: 'someColorValue-dark' } }
		};

		// prettier-ignore
		const expected = `
html.theme-light {
    --someColorToken: someColorValue-light
}
html.theme-dark {
    --someColorToken: someColorValue-dark
}
`.trim()

		const actual = await runPlugin(themes);
		expect(actual).toEqual(expected);
	});
});
