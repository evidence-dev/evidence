import { describe, expect, it } from 'vitest';
import { histogramTooltipHtml } from './histogram-tooltip';
import { createTranslator } from '../../../locale/messages';
import { getLanguagePack } from '../../../locale/registry';

const text = (html: string) =>
	html
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

describe('histogramTooltipHtml', () => {
	it('labels the bin in the page language', () => {
		const bin = { seriesRow: '', range: '10 – 20', frequency: '42' };
		expect(
			text(histogramTooltipHtml(createTranslator('en', getLanguagePack('en').messages), bin))
		).toBe('Range 10 – 20 Count 42');
		expect(
			text(histogramTooltipHtml(createTranslator('fr', getLanguagePack('fr').messages), bin))
		).toBe('Intervalle 10 – 20 Effectif 42');
	});

	it('escapes the range text', () => {
		const html = histogramTooltipHtml(createTranslator('en', getLanguagePack('en').messages), {
			seriesRow: '',
			range: '<b>x</b>',
			frequency: '1'
		});
		expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
	});
});
