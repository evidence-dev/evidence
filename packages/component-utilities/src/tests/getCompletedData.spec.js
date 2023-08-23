import { describe, it, expect } from 'vitest';
import getCompletedData from '../getCompletedData';
import { genSeries } from './getCompletedData.fixture.js';

const sortFunc = (a, b) => {
	const deltaSeries = a.series?.charCodeAt(0) ?? -1 - b.series?.charCodeAt(0) ?? -1;
	if (deltaSeries !== 0) return deltaSeries;
	const deltaTime = a.time - b.time;
	if (deltaTime !== 0) return deltaTime;
	const deltaValue = a.value - b.value;
	if (deltaValue !== 0) return deltaValue;
	return 0;
};

const series = [];

/*
    This is responsible for generating a variety of scenarios that the function may encounter
    One factor is if the x-axis has values in all positions
    One factor is if the y-axis will always have a value, or if it can be null
    One factor is if the series field is always set, or if it is sometimes set to null
 */
for (const xHasGaps of [true, false]) {
	for (const yHasNulls of [true, false]) {
		for (const seriesAlwaysExists of [true, false]) {
			for (const xType of ['date', 'number'])
				series.push({
					xHasGaps,
					yHasNulls,
					seriesAlwaysExists,
					xType,
					data: genSeries({
						xHasGaps,
						yHasNulls,
						seriesAlwaysExists,
						xType,
						seriesLen: 3,
						seriesCount: 2,
						maxInterval: 1,
						maxOffset: 0
					})
				});
		}
	}
}

describe('getCompletedData', () => {
	describe.each(series)(
		'xHasGaps = $xHasGaps, yHasNulls = $yHasNulls, seriesAlwaysExists = $seriesAlwaysExists, xType = "$xType"',
		/**
		 * @param {ReturnType<typeof genSeries>} opts
		 */
		(opts) => {
			const { data, series } = opts.data;
			it('returns no duplicate rows', () => {
				const result = getCompletedData(data, 'time', 'value', 'series', false, false);
				for (const row of result) {
					expect(
						result.filter(
							(row2) =>
								row.time === row2.time && row.value === row2.value && row.series === row2.series
						).length
					).toBe(1);
				}
			});

			it('replaces nulls with zero if nullsZero is set', () => {
				const result = getCompletedData(data, 'time', 'value', 'series', true, true);

				for (const row of data.filter((r) => r.value === null)) {
					expect(
						result.find((r) => r.series === row.series && r.time.toString() === row.time.toString())
							?.value
					).toBeCloseTo(0);
				}
			});

			it('does not fill x-axis values if fillX is not set', () => {
				const result = getCompletedData(data, 'time', 'value', 'series', false, false);

				// Expect specific behavior here based on your function's logic
				expect(result.every((r) => data.some((d) => r.time === d.time && r.series === d.series)));
			});

			it('returns the original data if series is not defined', () => {
				const result = getCompletedData(data, 'time', 'value', undefined, false, false);

				const r = result.sort(sortFunc);
				const d = data.sort(sortFunc);
				expect(r).toEqual(d);
			});

			it('fills missing x-axis values with null if fillX is set and not nullsZero', () => {
				const result = getCompletedData(data, 'time', 'value', 'series', false, true);
				// Expect specific behavior here based on your function's logic
				for (const seriesName in series) {
					for (const row of result.filter((r) => r.series === seriesName)) {
						const inputRow = data.find((d) => d.series === row.series && d.time === row.time);
						if (inputRow) {
							// This row already existed
							expect(row.value).toEqual(inputRow.value);
						} else {
							// This row was inserted
							expect(row.value).toBe(null);
						}
					}
				}
			});

			it('fills missing x-axis values with zero if fillX and nullsZero are set', () => {
				const result = getCompletedData(data, 'time', 'value', 'series', true, true);
				// Expect specific behavior here based on your function's logic
				for (const seriesName in series) {
					for (const row of result.filter((r) => r.series === seriesName)) {
						const inputRow = data.find((d) => d.series === row.series && d.time === row.time);
						if (inputRow && inputRow.value !== null) {
							// This row already existed
							expect(row.value).toEqual(inputRow.value);
						} else {
							// This row was inserted
							expect(row.value).toBe(0);
						}
					}
				}
			});
		}
	);
});
