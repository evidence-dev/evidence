import { describe, it, expect } from 'vitest';
import {
	processTranslationsThroughI18next,
	resolveTranslations,
	selectLanguage
} from './resolve-translations';
import type { TranslationMap } from '../types/translations';

describe('selectLanguage', () => {
	it('returns the requested language when it is declared', () => {
		expect(selectLanguage(['en', 'fr'], 'fr')).toBe('fr');
	});

	it('falls back to the first language when the requested one is unknown', () => {
		expect(selectLanguage(['en', 'fr'], 'zz')).toBe('en');
	});

	it('falls back to the first language when none is requested', () => {
		expect(selectLanguage(['es', 'fr'], null)).toBe('es');
	});

	it('returns null when there are no languages', () => {
		expect(selectLanguage([], 'en')).toBeNull();
	});
});

describe('processTranslationsThroughI18next', () => {
	it('resolves simple string translations', async () => {
		const result = await processTranslationsThroughI18next(
			{
				greeting: 'Hello',
				farewell: 'Goodbye'
			},
			'en'
		);

		expect(result).toEqual({
			greeting: 'Hello',
			farewell: 'Goodbye'
		});
	});

	it('preserves nested structure', async () => {
		const result = await processTranslationsThroughI18next(
			{
				messages: {
					welcome: 'Welcome',
					error: 'An error occurred'
				}
			},
			'en'
		);

		expect(result).toEqual({
			messages: {
				welcome: 'Welcome',
				error: 'An error occurred'
			}
		});
	});

	it('handles deeply nested structures', async () => {
		const result = await processTranslationsThroughI18next(
			{
				ui: {
					buttons: {
						submit: 'Submit',
						cancel: 'Cancel'
					},
					labels: {
						name: 'Name'
					}
				}
			},
			'en'
		);

		expect(result).toEqual({
			ui: {
				buttons: {
					submit: 'Submit',
					cancel: 'Cancel'
				},
				labels: {
					name: 'Name'
				}
			}
		});
	});

	it('resolves i18next nesting with $t()', async () => {
		const result = await processTranslationsThroughI18next(
			{
				name: 'World',
				greeting: 'Hello, $t(name)!'
			},
			'en'
		);

		expect(result.greeting).toBe('Hello, World!');
	});

	it('resolves nested $t() references', async () => {
		const result = await processTranslationsThroughI18next(
			{
				messages: {
					welcome: 'Welcome'
				},
				fullGreeting: 'Hello! $t(messages.welcome) to our app.'
			},
			'en'
		);

		expect(result.fullGreeting).toBe('Hello! Welcome to our app.');
	});

	it('handles interpolation with {{variable}}', async () => {
		const result = await processTranslationsThroughI18next(
			{
				greeting: 'Hello, {{name}}!'
			},
			'en'
		);

		// Without passing interpolation values, the placeholder remains
		expect(result.greeting).toBe('Hello, {{name}}!');
	});

	describe('misuse with non-string values', () => {
		it('preserves non-string values', async () => {
			const result = await processTranslationsThroughI18next(
				{
					count: 42,
					enabled: true,
					config: null
				} as unknown as TranslationMap,
				'en'
			);

			expect(result).toEqual({
				count: 42,
				enabled: true,
				config: null
			});
		});

		it('preserves arrays', async () => {
			const result = await processTranslationsThroughI18next(
				{
					items: ['one', 'two', 'three']
				} as unknown as TranslationMap,
				'en'
			);

			expect(result).toEqual({
				items: ['one', 'two', 'three']
			});
		});

		it('handles mixed content with strings, objects, and other types', async () => {
			const result = await processTranslationsThroughI18next(
				{
					title: 'My App',
					version: 1.0,
					features: {
						enabled: true,
						name: 'Feature X'
					},
					tags: ['tag1', 'tag2']
				} as unknown as TranslationMap,
				'en'
			);

			expect(result).toEqual({
				title: 'My App',
				version: 1.0,
				features: {
					enabled: true,
					name: 'Feature X'
				},
				tags: ['tag1', 'tag2']
			});
		});
	});

	it('handles empty object', async () => {
		const result = await processTranslationsThroughI18next({}, 'en');
		expect(result).toEqual({});
	});

	it('works with different language codes', async () => {
		const result = await processTranslationsThroughI18next(
			{
				greeting: 'Bonjour'
			},
			'fr'
		);

		expect(result).toEqual({
			greeting: 'Bonjour'
		});
	});
});

describe('resolveTranslations', () => {
	it('returns translations for requested language', async () => {
		const result = await resolveTranslations(
			{
				en: { greeting: 'Hello' },
				fr: { greeting: 'Bonjour' }
			},
			'fr'
		);

		expect(result.greeting).toBe('Bonjour');
	});

	it('falls back to first language for missing keys', async () => {
		const result = await resolveTranslations(
			{
				en: { greeting: 'Hello', farewell: 'Goodbye' },
				fr: { greeting: 'Bonjour' }
			},
			'fr'
		);

		expect(result.greeting).toBe('Bonjour');
		expect(result.farewell).toBe('Goodbye');
	});

	it('falls back for nested keys', async () => {
		const result = await resolveTranslations(
			{
				en: {
					messages: {
						welcome: 'Welcome',
						error: 'An error occurred'
					}
				},
				fr: {
					messages: {
						welcome: 'Bienvenue'
					}
				}
			},
			'fr'
		);

		const messages = result.messages as Record<string, string>;
		expect(messages.welcome).toBe('Bienvenue');
		expect(messages.error).toBe('An error occurred');
	});

	it('always uses English as fallback', async () => {
		const result = await resolveTranslations(
			{
				de: { greeting: 'Hallo', farewell: 'Auf Wiedersehen' },
				en: { farewell: 'Goodbye' },
				fr: { greeting: 'Bonjour' }
			},
			'fr'
		);

		expect(result.greeting).toBe('Bonjour');
		expect(result.farewell).toBe('Goodbye'); // From en, not de
	});

	it('returns English translations if requested language not found', async () => {
		const result = await resolveTranslations(
			{
				en: { greeting: 'Hello' }
			},
			'fr'
		);

		expect(result.greeting).toBe('Hello');
	});

	it('returns empty if no English and requested language not found', async () => {
		const result = await resolveTranslations(
			{
				de: { greeting: 'Hallo' }
			},
			'fr'
		);

		expect(result.greeting).toBeUndefined();
	});

	it('returns empty object for empty translations', async () => {
		const result = await resolveTranslations({}, 'en');
		expect(result).toEqual({});
	});

	it('resolves $t() references after fallback merge', async () => {
		const result = await resolveTranslations(
			{
				en: {
					name: 'World',
					greeting: 'Hello, $t(name)!'
				},
				fr: {
					greeting: 'Bonjour, $t(name)!'
				}
			},
			'fr'
		);

		expect(result.greeting).toBe('Bonjour, World!');
	});
});
