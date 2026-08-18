import { describe, it, expect } from 'vitest';
import { applyFormatCodes } from './apply-format-codes';

describe('applyFormatCodes', () => {
	it('replaces fmt: strings on formatter keys with formatting functions', () => {
		const config = applyFormatCodes({
			yAxis: { axisLabel: { formatter: 'fmt:usd0' } }
		});

		const formatter = config.yAxis.axisLabel.formatter as unknown as (v: unknown) => string;
		expect(typeof formatter).toBe('function');
		expect(formatter(32000000)).toBe('$32,000,000');
	});

	it('replaces fmt: strings on valueFormatter keys', () => {
		const config = applyFormatCodes({
			tooltip: { valueFormatter: 'fmt:usd1m' }
		});

		const valueFormatter = config.tooltip.valueFormatter as unknown as (v: unknown) => string;
		expect(valueFormatter(6200000)).toBe('$6.2M');
		expect(valueFormatter(null)).toBe('');
	});

	it('resolves the encoded dimension from dataset-style label params', () => {
		const config = applyFormatCodes({
			series: [{ label: { formatter: 'fmt:usd1m' } }]
		});
		const formatter = config.series[0].label.formatter as unknown as (v: unknown) => string;

		// echarts label formatters receive a params object whose value is the
		// full dataset row when using dataset + encode
		const params = {
			value: { step: 'Home', inc: 6200000 },
			encode: { x: [0], y: [1] },
			dimensionNames: ['step', 'inc']
		};
		expect(formatter(params)).toBe('$6.2M');

		const arrayRowParams = {
			value: ['Home', 6200000],
			encode: { x: [0], y: [1] },
			dimensionNames: ['step', 'inc']
		};
		expect(formatter(arrayRowParams)).toBe('$6.2M');
	});

	it('returns empty string for rows where the encoded dimension is null', () => {
		const config = applyFormatCodes({ series: [{ label: { formatter: 'fmt:usd1m' } }] });
		const formatter = config.series[0].label.formatter as unknown as (v: unknown) => string;

		expect(
			formatter({
				value: { step: 'Total', inc: null },
				encode: { x: [0], y: [1] },
				dimensionNames: ['step', 'inc']
			})
		).toBe('');
	});

	it('rebuilds an axis-trigger tooltip when the formatter receives an array of params', () => {
		const config = applyFormatCodes({ tooltip: { trigger: 'axis', formatter: 'fmt:usd1m' } });
		const formatter = config.tooltip.formatter as unknown as (v: unknown) => string;

		// trigger:'axis' calls the formatter once with an array (one per series)
		const result = formatter([
			{
				axisValueLabel: 'Home',
				marker: '<span>●</span>',
				seriesName: 'Increase',
				value: { step: 'Home', inc: 6200000, dec: null },
				encode: { x: [0], y: [1] },
				dimensionNames: ['step', 'inc', 'dec']
			},
			{
				axisValueLabel: 'Home',
				marker: '<span>●</span>',
				seriesName: 'Decrease',
				value: { step: 'Home', inc: 6200000, dec: null },
				encode: { x: [0], y: [2] },
				dimensionNames: ['step', 'inc', 'dec']
			}
		]);

		// Header + only the series with a non-null value; the null Decrease row is dropped
		expect(result).toBe('Home<br/><span>●</span>Increase: $6.2M');
	});

	it('leaves echarts string templates and non-formatter keys untouched', () => {
		const config = {
			xAxis: { axisLabel: { formatter: '${value}M' } },
			series: [{ label: { formatter: '+{@inc}' }, name: 'fmt:not-a-formatter-key' }],
			tooltip: { trigger: 'item' }
		};

		expect(applyFormatCodes(config)).toEqual(config);
	});
});
