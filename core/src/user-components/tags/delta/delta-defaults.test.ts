import { describe, it, expect } from 'vitest';
import { schema as deltaDefaultsSchema } from '../delta_defaults/schema';
import {
	projectRootPageFrontmatterSchema,
	projectLayoutSchema
} from '../../../config/page-frontmatter-schema';
import { pageSettingsSchema } from '../../interfaces/project-settings';
import { themeConfigSchema, themeOverridesSchema } from '../../../types/theme';
import { DEFAULT_THEME } from '../../../constants/default-theme';

describe('Global downIsGood / DeltaDefaults configuration', () => {
	describe('DeltaDefaults Schema', () => {
		it('declares render name delta_defaults with down_is_good and downIsGood attributes', () => {
			expect(deltaDefaultsSchema.render).toBe('delta_defaults');
			expect(deltaDefaultsSchema.attributes.down_is_good).toBeDefined();
			expect(deltaDefaultsSchema.attributes.downIsGood).toBeDefined();
			expect(deltaDefaultsSchema.selfClosing).toBe(false);
		});
	});

	describe('Page Frontmatter & Layout Schemas', () => {
		it('parses down_is_good and downIsGood in page frontmatter schema', () => {
			const parsedSnake = projectRootPageFrontmatterSchema.parse({
				down_is_good: true
			});
			expect(parsedSnake.down_is_good).toBe(true);

			const parsedCamel = projectRootPageFrontmatterSchema.parse({
				downIsGood: true
			});
			expect(parsedCamel.downIsGood).toBe(true);
		});

		it('parses down_is_good and downIsGood in project layout schema', () => {
			const parsedSnake = projectLayoutSchema.parse({
				down_is_good: true
			});
			expect(parsedSnake.down_is_good).toBe(true);

			const parsedCamel = projectLayoutSchema.parse({
				downIsGood: true
			});
			expect(parsedCamel.downIsGood).toBe(true);
		});

		it('parses down_is_good and downIsGood in pageSettingsSchema', () => {
			const parsed = pageSettingsSchema.parse({
				down_is_good: true,
				downIsGood: true
			});
			expect(parsed.down_is_good).toBe(true);
			expect(parsed.downIsGood).toBe(true);
		});
	});

	describe('Theme Schemas', () => {
		it('accepts delta and defaults in themeOverridesSchema', () => {
			const override = themeOverridesSchema.parse({
				delta: {
					downIsGood: true
				},
				defaults: {
					down_is_good: true
				}
			});
			expect(override.delta?.downIsGood).toBe(true);
			expect(override.defaults?.down_is_good).toBe(true);
		});

		it('validates DEFAULT_THEME against themeConfigSchema', () => {
			const parsed = themeConfigSchema.parse(DEFAULT_THEME);
			expect(parsed).toBeDefined();
		});
	});
});
