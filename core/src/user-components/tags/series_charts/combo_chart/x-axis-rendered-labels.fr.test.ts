import { describe, expect, it } from 'vitest';
import {
	renderAxis,
	DATE_COL,
	monthlyRows,
	dailyRows,
	quarterlyRows,
	hourlyRows
} from './x-axis-test-harness';
import { FR_DATE_LOCALE, formatDate } from '../../../../locale/date-locale';

/**
 * END-TO-END French axis labels through the real XAxisModel → layout helpers →
 * ECharts SSR pipeline. The formatter unit tests pin the words; these pin that
 * the wider CLDR abbreviations ("sept.", "janv.") survive width-aware thinning
 * and rotation decisions the same way their English counterparts do.
 */
const fr = {
	xAxisOptions: { dateLocale: FR_DATE_LOCALE, language: 'fr' },
	columns: DATE_COL,
	x: 'x',
	y: 'y'
};

describe('x-axis rendered labels (fr)', () => {
	it('month · 12 months, single calendar year · wide → bare French months', () => {
		const result = renderAxis({
			...fr,
			width: 700,
			rows: monthlyRows(2024, 0, 12),
			dateGrain: 'month'
		});
		expect(result.labels).toEqual([
			'janv.',
			'févr.',
			'mars',
			'avr.',
			'mai',
			'juin',
			'juil.',
			'août',
			'sept.',
			'oct.',
			'nov.',
			'déc.'
		]);
		expect(result.rotated).toBe(false);
	});

	it('month · 12 months across a year boundary · wide → two-tier year at first tick and January', () => {
		const result = renderAxis({
			...fr,
			width: 700,
			rows: monthlyRows(2024, 6, 12),
			dateGrain: 'month'
		});
		expect(result.labels[0]).toBe('juil.\n2024');
		expect(result.labels).toContain('janv.\n2025');
		expect(result.labels.filter((l) => l.includes('\n'))).toHaveLength(2);
	});

	it('month · 12 months, single calendar year · phone → thinned, still French', () => {
		const result = renderAxis({
			...fr,
			width: 375,
			rows: monthlyRows(2024, 0, 12),
			dateGrain: 'month'
		});
		expect(result.labels.length).toBeLessThan(12);
		expect(result.labels[0]).toBe('janv.');
		const frenchMonths = Array.from({ length: 12 }, (_, m) =>
			formatDate(FR_DATE_LOCALE, 'month', new Date(2024, m, 1))
		);
		for (const label of result.labels) expect(frenchMonths).toContain(label);
	});

	it('day · 40 days crossing months · wide → same ECharts ticks as English, "juil." at rollover', () => {
		const result = renderAxis({
			...fr,
			width: 700,
			rows: dailyRows(2025, 5, 40),
			dateGrain: 'day'
		});
		// English matrix: ['2', '5', '9', '13', '17', '21', '25', '29', 'Jul', '3', '5', '9']
		expect(result.labels).toEqual([
			'2',
			'5',
			'9',
			'13',
			'17',
			'21',
			'25',
			'29',
			'juil.',
			'3',
			'5',
			'9'
		]);
	});

	it('day · 10 days · wide → "1 juin" first-tick anchor, rest bare', () => {
		const result = renderAxis({
			...fr,
			width: 700,
			rows: dailyRows(2025, 5, 10),
			dateGrain: 'day'
		});
		expect(result.labels[0]).toBe('1 juin');
		expect(result.labels.slice(1)).toEqual(['2', '3', '4', '5', '6', '7', '8', '9', '10']);
	});

	it('quarter · 4 quarters across a year boundary · wide → two-tier with T prefix', () => {
		const result = renderAxis({
			...fr,
			width: 700,
			rows: quarterlyRows(2024, 2, 4),
			dateGrain: 'quarter'
		});
		expect(result.labels).toEqual(['T3\n2024', 'T4', 'T1\n2025', 'T2']);
	});

	it('quarter · 8 quarters multi-year · wide → inline "T3 2023" anchor, bare-year boundaries', () => {
		const result = renderAxis({
			...fr,
			width: 700,
			rows: quarterlyRows(2023, 2, 8),
			dateGrain: 'quarter'
		});
		expect(result.labels).toEqual(['T3 2023', 'T4', '2024', 'T2', 'T3', 'T4', '2025', 'T2']);
	});

	it('hour · 6h same day · wide → 24-hour clock', () => {
		const result = renderAxis({
			...fr,
			width: 700,
			rows: hourlyRows(2025, 5, 15, 8, 6),
			dateGrain: 'hour'
		});
		expect(result.labels).toEqual(['8 h', '9 h', '10 h', '11 h', '12 h', '13 h']);
	});

	describe('explicit x_fmt', () => {
		// An author's `fmt` bypasses the grain formatter and goes through
		// formatValue with the page language the chart passed in its options.
		it('month names inside a custom fmt are French, numeric tokens untouched', () => {
			const result = renderAxis({
				...fr,
				width: 900,
				rows: monthlyRows(2024, 0, 6),
				dateGrain: 'month',
				fmt: 'mmm yyyy'
			});
			expect(result.labels).toEqual([
				'janv. 2024',
				'févr. 2024',
				'mars 2024',
				'avr. 2024',
				'mai 2024',
				'juin 2024'
			]);
		});

		it('a numeric-only fmt renders identically in any language', () => {
			const result = renderAxis({
				...fr,
				width: 900,
				rows: monthlyRows(2024, 0, 3),
				dateGrain: 'month',
				fmt: 'yyyy-mm'
			});
			expect(result.labels).toEqual(['2024-01', '2024-02', '2024-03']);
		});
	});
});
