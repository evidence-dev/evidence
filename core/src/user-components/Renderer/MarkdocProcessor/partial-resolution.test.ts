import { describe, test, expect } from 'vitest';
import { process } from './process-markdoc';
import type { ValidationContext } from '../../validators/types';

const ctx = (over: Partial<ValidationContext> = {}): ValidationContext => ({
	metadata: undefined,
	filters: undefined,
	inlineQueries: undefined,
	trees: undefined,
	...over
});

const hasInvalidPartial = (errors: ReturnType<typeof process>['validationErrors']): boolean =>
	errors.some((e) => e.error?.id === 'invalid-partial');

const treeText = (tree: ReturnType<typeof process>['tree']): string => JSON.stringify(tree);

describe('Partial resolution', () => {
	describe('legacy (gate off) — exact-key lookup unchanged', () => {
		test('resolves an exact-key partial', () => {
			const { validationErrors, tree } = process('{% partial file="footer" /%}', ctx(), {
				footer: 'FOOTER_CONTENT_X'
			});
			expect(hasInvalidPartial(validationErrors)).toBe(false);
			expect(treeText(tree)).toContain('FOOTER_CONTENT_X');
		});

		test('flags a missing partial', () => {
			const { validationErrors } = process('{% partial file="missing" /%}', ctx(), {
				footer: 'x'
			});
			expect(hasInvalidPartial(validationErrors)).toBe(true);
		});

		test('a "from here"-style ref does NOT resolve when gate is off', () => {
			// Map is keyed by full path; without relative resolution a bare ref misses.
			const { validationErrors } = process('{% partial file="footer" /%}', ctx(), {
				'pages/footer': 'x'
			});
			expect(hasInvalidPartial(validationErrors)).toBe(true);
		});
	});

	describe('new model (gate on)', () => {
		const on = (basePath: string) => ctx({ useRelativeResolution: true, basePath });

		test('no-slash ref resolves relative to the page dir (sibling)', () => {
			const { validationErrors, tree } = process('{% partial file="footer" /%}', on('pages/home'), {
				'pages/footer': 'FOOTER_CONTENT_Y'
			});
			expect(hasInvalidPartial(validationErrors)).toBe(false);
			expect(treeText(tree)).toContain('FOOTER_CONTENT_Y');
		});

		test('leading-slash ref resolves from the project root', () => {
			const { validationErrors, tree } = process(
				'{% partial file="/partials/footer" /%}',
				on('pages/reports/q4'),
				{ 'partials/footer': 'ROOT_PARTIAL_Z' }
			);
			expect(hasInvalidPartial(validationErrors)).toBe(false);
			expect(treeText(tree)).toContain('ROOT_PARTIAL_Z');
		});

		test('nested partial resolves relative to the OUTER partial dir', () => {
			const { validationErrors, tree } = process('{% partial file="footer" /%}', on('pages/home'), {
				// footer (at pages/) includes `logo` -> should resolve to pages/logo
				'pages/footer': 'OUTER {% partial file="logo" /%}',
				'pages/logo': 'INNER_LOGO'
			});
			expect(hasInvalidPartial(validationErrors)).toBe(false);
			expect(treeText(tree)).toContain('INNER_LOGO');
		});

		test('a non-sibling no-slash ref is flagged (from-here only)', () => {
			const { validationErrors } = process('{% partial file="footer" /%}', on('pages/reports/q4'), {
				'pages/footer': 'x'
			});
			// `footer` resolves to pages/reports/footer, which does not exist.
			expect(hasInvalidPartial(validationErrors)).toBe(true);
		});
	});
});
