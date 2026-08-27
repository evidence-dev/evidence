import { describe, it, expect } from 'vitest';
import { LocaleState } from './locale-context.svelte';

describe('Locale & Translation System (i18n)', () => {
	it('defaults to English dictionary', () => {
		const state = new LocaleState('en-US');
		expect(state.locale).toBe('en-US');
		expect(state.t('today')).toBe('Today');
		expect(state.t('search')).toBe('Search...');
		expect(state.t('last_7_days')).toBe('Last 7 Days');
	});

	it('supports Italian translation (it-IT)', () => {
		const state = new LocaleState('it-IT');
		expect(state.locale).toBe('it-IT');
		expect(state.t('today')).toBe('Oggi');
		expect(state.t('yesterday')).toBe('Ieri');
		expect(state.t('last_7_days')).toBe('Ultimi 7 giorni');
		expect(state.t('this_month')).toBe('Questo mese');
		expect(state.t('search')).toBe('Cerca...');
		expect(state.t('total')).toBe('Totale');
		expect(state.t('download')).toBe('Scarica');
	});

	it('interpolates translation parameters', () => {
		const state = new LocaleState('it-IT');
		expect(state.t('page_of', { page: 2, total: 10 })).toBe('Pagina 2 di 10');
	});

	it('formats dates according to locale', () => {
		const state = new LocaleState('it-IT');
		const testDate = new Date(2026, 7, 27); // 27 Aug 2026
		const formatted = state.formatDate(testDate, { month: 'long' });
		expect(formatted.toLowerCase()).toContain('agosto');
	});
});
