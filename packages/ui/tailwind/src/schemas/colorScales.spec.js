import { describe, it, expect } from 'vitest';
import { ThemeColorScalesSchema } from './colorScales';

describe('ThemeColorScalesSchema', () => {
	it('should transform single color scale into that color scale for light and dark', () => {
		const colors = {
			myColorScale: ['myColorScale_color1', 'myColorScale_color2', 'myColorScale_color3']
		};
		const result = ThemeColorScalesSchema.parse(colors);
		expect(result['myColorScale']).toEqual({
			light: ['myColorScale_color1', 'myColorScale_color2', 'myColorScale_color3'],
			dark: ['myColorScale_color1', 'myColorScale_color2', 'myColorScale_color3']
		});
	});
});
