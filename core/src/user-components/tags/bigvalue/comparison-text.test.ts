import { describe, expect, it } from 'vitest';
import { bigValueComparisonText } from './comparison-text';
import { createTranslator } from '../../../locale/messages';
import { getLanguagePack } from '../../../locale/registry';

const en = createTranslator('en', getLanguagePack('en').messages);
const fr = createTranslator('fr', getLanguagePack('fr').messages);

describe('bigValueComparisonText', () => {
	it('labels a comparison_selector built-in option in the page language, keeping English as before', () => {
		const fromSelector = { compare_vs: 'prior year', name: 'prior year' };
		expect(bigValueComparisonText(fromSelector, en)).toBe('prior year');
		expect(bigValueComparisonText(fromSelector, fr)).toBe('vs année précédente');
		expect(bigValueComparisonText({ compare_vs: 'target', name: 'target' }, fr)).toBe(
			'vs objectif'
		);
	});

	it('uses the default text for a literal compare_vs', () => {
		expect(bigValueComparisonText({ compare_vs: 'prior year' }, en)).toBe('vs. last year');
		expect(bigValueComparisonText({ compare_vs: 'prior year' }, fr)).toBe('vs année précédente');
		expect(bigValueComparisonText({ compare_vs: 'prior period' }, fr)).toBe(
			'vs période précédente'
		);
	});

	it('keeps author-written text and custom option names verbatim', () => {
		expect(bigValueComparisonText({ compare_vs: 'target', text: 'vs. plan' }, fr)).toBe('vs. plan');
		expect(bigValueComparisonText({ compare_vs: 'benchmark', name: 'vs. Franchisees' }, fr)).toBe(
			'vs. Franchisees'
		);
		expect(bigValueComparisonText(undefined, fr)).toBe('');
	});
});
