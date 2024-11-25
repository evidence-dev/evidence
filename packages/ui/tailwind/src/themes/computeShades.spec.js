import { describe, it, expect } from 'vitest';

import { computeShades } from './computeShades';

import chroma from 'chroma-js';

describe('computeShades', () => {
	it('should populate -content colors', () => {
		/** @type {import('../schemas/types.js').ThemesConfigFile} */
		const config = {
			themes: {
				colors: {
					primary: {
						light: '#abcdef',
						dark: '#fedcba'
					}
				}
			}
		};

		const afterCompute = computeShades(config);
		expect(afterCompute.themes.colors['primary-content'].light).toBeDefined();
		expect(
			chroma.contrast(
				afterCompute.themes.colors['primary'].light,
				afterCompute.themes.colors['primary-content'].light
			)
		).toBeGreaterThan(4.5);

		expect(afterCompute.themes.colors['primary-content'].dark).toBeDefined();
		expect(
			chroma.contrast(
				afterCompute.themes.colors['primary'].dark,
				afterCompute.themes.colors['primary-content'].dark
			)
		).toBeGreaterThan(4.5);
	});

	it('should generate base-200, base-heading, base-content, and base-content-muted from base-100', () => {
		/** @type {import('../schemas/types.js').ThemesConfigFile} */
		const config = {
			themes: {
				colors: {
					'base-100': {
						light: '#e5e7eb',
						dark: '#1f2937'
					}
				}
			}
		};

		const afterCompute = computeShades(config);

		expect(afterCompute.themes.colors['base-100'].light).toBeDefined();
		expect(afterCompute.themes.colors['base-200'].light).toBeDefined();
		expect(afterCompute.themes.colors['base-content'].light).toBeDefined();
		expect(afterCompute.themes.colors['base-heading'].light).toBeDefined();
		expect(afterCompute.themes.colors['base-content-muted'].light).toBeDefined();
		expect(
			chroma.contrast(
				afterCompute.themes.colors['base-100'].light,
				afterCompute.themes.colors['base-heading'].light
			)
		).toBeGreaterThan(7);
		expect(
			chroma.contrast(
				afterCompute.themes.colors['base-100'].light,
				afterCompute.themes.colors['base-content'].light
			)
		).toBeGreaterThan(7);
		expect(
			chroma.contrast(
				afterCompute.themes.colors['base-100'].light,
				afterCompute.themes.colors['base-content-muted'].light
			)
		).toBeGreaterThan(7);

		expect(afterCompute.themes.colors['base-100'].dark).toBeDefined();
		expect(afterCompute.themes.colors['base-200'].dark).toBeDefined();
		expect(afterCompute.themes.colors['base-content'].dark).toBeDefined();
		expect(afterCompute.themes.colors['base-heading'].dark).toBeDefined();
		expect(afterCompute.themes.colors['base-content-muted'].dark).toBeDefined();
		expect(
			chroma.contrast(
				afterCompute.themes.colors['base-100'].dark,
				afterCompute.themes.colors['base-heading'].dark
			)
		).toBeGreaterThan(7);
		expect(
			chroma.contrast(
				afterCompute.themes.colors['base-100'].dark,
				afterCompute.themes.colors['base-content'].dark
			)
		).toBeGreaterThan(7);
		expect(
			chroma.contrast(
				afterCompute.themes.colors['base-100'].dark,
				afterCompute.themes.colors['base-content-muted'].dark
			)
		);
	});
});
