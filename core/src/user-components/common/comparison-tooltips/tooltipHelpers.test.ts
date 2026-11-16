import { describe, it, expect } from 'vitest';
import { buildTooltipContent } from './tooltipHelpers';
import { createTranslator } from '../../../locale/messages';
import { getLanguagePack } from '../../../locale/registry';

const tEn = createTranslator('en', getLanguagePack('en').messages);
const tFr = createTranslator('fr', getLanguagePack('fr').messages);

const id = '__ev_sales_comparison';
const row = { region: 'East' };
const rawData: Record<string, unknown>[] = [
	{
		region: 'East',
		sales: 120,
		[`${id}_compared_value`]: 100,
		[`${id}_abs`]: 20,
		[`${id}_pct`]: 0.2
	}
];

const build = (
	t: typeof tEn,
	type: Parameters<typeof buildTooltipContent>[1],
	data = rawData,
	hidePct = false
) =>
	buildTooltipContent(
		t,
		type,
		row,
		data,
		['region'],
		[],
		id,
		'sales',
		undefined,
		false,
		undefined,
		undefined,
		undefined,
		hidePct
	);

const labels = (content: ReturnType<typeof build>) => [
	content.title,
	...content.rows.map((r) => r.label)
];

describe('buildTooltipContent labels', () => {
	it('keeps the English labels', () => {
		expect(labels(build(tEn, 'target'))).toEqual([
			'vs Target',
			'Actual',
			'Target',
			'separator',
			'Change (abs)',
			'Change (%)'
		]);
		expect(labels(build(tEn, 'prior year'))).toEqual([
			'Prior Year Comparison',
			'Current',
			'Prior Year',
			'separator',
			'Change',
			'Change %'
		]);
		expect(labels(build(tEn, 'prior period'))[0]).toBe('Prior Period Comparison');
		expect(labels(build(tEn, 'benchmark'))).toEqual([
			'Benchmark Comparison',
			'Value',
			'Benchmark',
			'separator',
			'Difference',
			'Difference %'
		]);
	});

	it('renders the labels in French', () => {
		expect(labels(build(tFr, 'target'))).toEqual([
			'vs objectif',
			'Réel',
			'Objectif',
			'separator',
			'Écart absolu',
			'Écart (%)'
		]);
		expect(labels(build(tFr, 'prior period'))).toEqual([
			'Comparaison avec la période précédente',
			'Actuel',
			'Période précédente',
			'separator',
			'Écart',
			'Écart en\u00a0%'
		]);
		expect(labels(build(tFr, 'benchmark', rawData, true))).toEqual([
			'Comparaison avec la référence',
			'Valeur',
			'Référence',
			'separator',
			'Écart'
		]);
	});

	it('uses the SQL period ranges as row labels when present', () => {
		const withPeriods = [
			{
				...rawData[0],
				[`${id}_current_period`]: 'Jul 1/26 - Jul 31/26',
				[`${id}_previous_period`]: 'Jul 1/25 - Jul 31/25'
			}
		];
		const content = build(tFr, 'prior year', withPeriods);
		expect(content.rows.slice(0, 2)).toEqual([
			{ label: 'Jul 1/26 - Jul 31/26', value: '120' },
			{ label: 'Jul 1/25 - Jul 31/25', value: '100' }
		]);
	});

	it('shows the localized placeholder for missing values', () => {
		const sparse = [{ region: 'East', sales: 120 }];
		expect(build(tEn, 'target', sparse).rows.map((r) => r.value)).toEqual([
			'120',
			'N/A',
			'',
			'N/A',
			'N/A'
		]);
		expect(build(tFr, 'target', sparse).rows.map((r) => r.value)).toEqual([
			'120',
			'N/D',
			'',
			'N/D',
			'N/D'
		]);
	});
});
