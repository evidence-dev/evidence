import { describe, it, expect } from 'vitest';
import { ThemeColorPalettesSchema } from './colorPalettes';

describe('ThemeColorPalettesSchema', () => {
	it('should transform single color palette into that color palette for light and dark', () => {
		const colors = {
			myColorPalette: ['myColorPalette_color1', 'myColorPalette_color2', 'myColorPalette_color3']
		};
		const result = ThemeColorPalettesSchema.parse(colors);
		expect(result['myColorPalette']).toEqual({
			light: ['myColorPalette_color1', 'myColorPalette_color2', 'myColorPalette_color3'],
			dark: ['myColorPalette_color1', 'myColorPalette_color2', 'myColorPalette_color3']
		});
	});
});
