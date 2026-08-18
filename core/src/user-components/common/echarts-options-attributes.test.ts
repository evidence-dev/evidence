import { describe, it, expect } from 'vitest';
import type { EChartsOption } from 'echarts';
import { mergeEchartsOptions } from './echarts-options-attributes';

describe('mergeEchartsOptions', () => {
	it('deep-merges echarts_options over computed options, key-by-key', () => {
		const base = {
			tooltip: { trigger: 'item', confine: true },
			grid: { left: 10 }
		} as unknown as EChartsOption;

		const result = mergeEchartsOptions(base, {
			echarts_options: { tooltip: { position: 'top' }, grid: { bottom: 70 } }
		});

		// Sibling keys survive; overrides win on their own key.
		expect(result.tooltip).toEqual({ trigger: 'item', confine: true, position: 'top' });
		expect(result.grid).toEqual({ left: 10, bottom: 70 });
	});

	it('merges echarts_series_options into every series entry', () => {
		const base = {
			series: [
				{ type: 'bar', name: 'a' },
				{ type: 'bar', name: 'b' }
			]
		} as unknown as EChartsOption;

		const result = mergeEchartsOptions(base, {
			echarts_series_options: { itemStyle: { borderRadius: 8 } }
		});

		expect(result.series).toEqual([
			{ type: 'bar', name: 'a', itemStyle: { borderRadius: 8 } },
			{ type: 'bar', name: 'b', itemStyle: { borderRadius: 8 } }
		]);
	});

	it('applies series options first, then echarts_options wins last', () => {
		const base = {
			series: [{ type: 'pie', itemStyle: { borderRadius: 0 } }]
		} as unknown as EChartsOption;

		const result = mergeEchartsOptions(base, {
			echarts_series_options: { itemStyle: { borderRadius: 4 } },
			echarts_options: { series: [{ itemStyle: { borderRadius: 12 } }] }
		});

		// echarts_options is the final merge, so its borderRadius wins.
		expect(
			(result.series as { itemStyle: { borderRadius: number } }[])[0].itemStyle.borderRadius
		).toBe(12);
	});

	it('does not mutate the base options object', () => {
		const base = {
			series: [{ type: 'pie' }],
			tooltip: { trigger: 'item' }
		} as unknown as EChartsOption;
		const snapshot = JSON.parse(JSON.stringify(base));

		mergeEchartsOptions(base, {
			echarts_series_options: { itemStyle: { borderRadius: 8 } },
			echarts_options: { tooltip: { position: 'top' } }
		});

		expect(base).toEqual(snapshot);
	});

	it('is a no-op passthrough when no overrides are provided', () => {
		const base = { series: [{ type: 'pie' }] } as unknown as EChartsOption;
		expect(mergeEchartsOptions(base, {})).toEqual(base);
	});
});
