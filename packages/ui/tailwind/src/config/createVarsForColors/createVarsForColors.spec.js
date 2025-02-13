import { describe, it, expect } from 'vitest';

import { createVarsForColors } from './createVarsForColors';

describe('createVarsForColors', () => {
	it('should create CSS variables on the html element based on the theme', async () => {
		/** @type {import('../types.js').Themes} */
		const themes = {
			light: { colors: { someColorToken: 'someColorValue-light' } },
			dark: { colors: { someColorToken: 'someColorValue-dark' } }
		};

		const plugin = createVarsForColors(themes);

		let baseOut = '';
		plugin.handler({
			addBase(base) {
				baseOut += Object.entries(base).reduce((acc, [selector, value]) => {
					const statement = `${selector} {\n\t${Object.entries(value)
						.map(([k, v]) => `${k}: ${v}`)
						.join(';\n\t')};\n}`;
					acc += '\n' + statement;

					return acc;
				}, '');
			}
		});

		// prettier-ignore
		const expected = `
html.theme-light {
	--color-someColorToken: someColorValue-light;
	--someColorToken: someColorValue-light;
}
html.theme-dark {
	--color-someColorToken: someColorValue-dark;
	--someColorToken: someColorValue-dark;
}
`.trim()

		expect(baseOut.trim()).toEqual(expected);
	});
});
