import { describe, it, expect } from 'vitest';
import getCompletedData from '../getCompletedData';
import { genSeries } from './getCompletedData.fixture';
import { MissingYCase } from './getCompletedData.fixture.manual';

/**
 * @param {string} a
 * @param {string} b
 */
const stringSortFunc = (a, b) => {
	// Iterate through the strings
	for (let i = 0; i < a.length && i < b.length; i++) {
		const diff = a.charCodeAt(i) - b.charCodeAt(i);
		if (diff !== 0) return diff;
	}
	return a.length - b.length; // the longer string wins
};

let series = [];

const simple = false;

const fixturePermutations = {
	xHasGaps: simple ? [true, false] : [true, false],
	yHasNulls: simple ? [true, false] : [true, false],
	seriesAlwaysExists: simple ? [true, false] : [true, false],
	xType: simple ? ['category'] : ['date', 'number', 'category'],
	keys: simple
		? [undefined, { x: 'someX', y: 'someY', series: 'someSeries' }]
		: [undefined, { x: 'someX', y: 'someY', series: 'someSeries' }]
};

/*
    This is responsible for generating a variety of scenarios that the function may encounter
    One factor is if the x-axis has values in all positions
    One factor is if the y-axis will always have a value, or if it can be null
    One factor is if the series field is always set, or if it is sometimes set to null
 */
for (const xHasGaps of fixturePermutations.xHasGaps) {
	for (const yHasNulls of fixturePermutations.yHasNulls)
		for (const seriesAlwaysExists of fixturePermutations.seriesAlwaysExists)
			for (const xType of fixturePermutations.xType)
				for (const keys of fixturePermutations.keys)
					series.push({
						description: `(automatic) xType = "${xType}", xHasGaps = ${xHasGaps}, yHasNulls = ${yHasNulls}, seriesAlwaysExists = ${seriesAlwaysExists}, keys = "${JSON.stringify(
							keys
						)}"`,
						xHasGaps,
						yHasNulls,
						seriesAlwaysExists,
						xType,
						keys,
						manual: false,
						data: genSeries({
							xHasGaps,
							yHasNulls,
							seriesAlwaysExists,
							xType,
							keys,
							minSeriesLen: 2,
							maxSeriesLen: 2,
							maxSeriesCount: 2,
							maxInterval: 1,
							maxOffset: 0
						})
					});
}
series.push({
	description: '(manual) Manual gap values injected',
	data: MissingYCase
});

// Garlic Naan | Goa Chicken | Chicken Curry

/**
 * @typedef {Object} SeriesFixture
 * @property {import("./getCompletedData.fixture.js").GenSeriesResult} data
 * @property { 'date' | 'number' } xType
 * @property {boolean} seriesAlwaysExists
 * @property {boolean} yHasNulls
 * @property {boolean} xHasgaps
 * @property {boolean} manual
 */
describe('getCompletedData', () => {
	describe.each(series)(
		'$description',
		/**
		 * @param {SeriesFixture} opts
		 */
		(opts) => {
			const { data, keys } = opts.data;
			it('returns no duplicate rows', () => {
				const result = getCompletedData(data, keys.x, keys.y, keys.series, false, false);
				for (const row of result) {
					expect(
						result.filter(
							(row2) =>
								row[keys.x] === row2[keys.x] &&
								row[keys.y] === row2[keys.y] &&
								row[keys.series] === row2[keys.series]
						).length
					).toBe(1);
				}
			});

			it('replaces nulls with zero if nullsZero is set', () => {
				const result = getCompletedData(data, keys.x, keys.y, keys.series, true, true);

				for (const row of data.filter((r) => r[keys.y] === null)) {
					expect(
						result.find(
							(r) =>
								r[keys.series] === row[keys.series] &&
								r[keys.x].toString() === row[keys.x].toString()
						)?.[keys.y]
					).toBeCloseTo(0);
				}
			});

			it('does not fill x-axis values if fillX is not set', () => {
				const result = getCompletedData(data, keys.x, keys.y, keys.series, false, false);

				// Expect specific behavior here based on your function's logic
				expect(
					result.every((r) =>
						data.some((d) => r[keys.x] === d[keys.x] && r[keys.series] === d[keys.series])
					)
				);
			});

			it('returns identical columns to the original data', () => {
				const result = getCompletedData(data, keys.x, keys.y, keys.series, false, false);

				const r = Object.keys(result[0]).sort(stringSortFunc);
				const d = Object.keys(data[0]).sort(stringSortFunc);
				expect(r).toEqual(d);
			});

			// This condition is only applicable to non-date series
			if (opts.xType !== 'date')
				it('contains series each with identical lengths', () => {
					const result = getCompletedData(data, keys.x, keys.y, keys.series, false, true);
					/** @type {any[][]} */
					let groupedSeries = [];

					for (const seriesName of Object.keys(opts.data.series)) {
						const seriesItems = result.filter((d) => d[keys.series] === seriesName);
						groupedSeries.push(seriesItems);
					}

					expect(groupedSeries[0].length, 'Series must have more than one row').toBeGreaterThan(0);

					for (const s of groupedSeries) {
						expect(s.length, 'Series lengths must all be equal').toEqual(groupedSeries[0].length);
					}
				});

			it('returns the original data if series is not defined', () => {
				const { x, y } = keys;
				const result = getCompletedData(data, x, y, undefined, false, false);

				expect(data).toEqual(expect.arrayContaining(result));
			});

			it('fills missing x-axis values with null if fillX is set and not nullsZero', () => {
				const { x, y, series } = keys;

				const result = getCompletedData(data, x, y, series, false, true);
				// Expect specific behavior here based on your function's logic
				for (const seriesName in series) {
					for (const row of result.filter((r) => r[series] === seriesName)) {
						const inputRow = data.find((d) => d[series] === row[series] && d[x] === row[x]);
						if (inputRow) {
							// This row already existed
							expect(row[y]).toEqual(inputRow[y]);
						} else {
							// This row was inserted
							expect(row[y]).toBe(null);
						}
					}
				}
			});

			it('fills missing x-axis values with zero if fillX and nullsZero are set', () => {
				const { x, y, series } = keys;

				const result = getCompletedData(data, x, y, series, true, true);
				// Expect specific behavior here based on your function's logic
				for (const seriesName in series) {
					for (const row of result.filter((r) => r[series] === seriesName)) {
						const inputRow = data.find((d) => d[series] === row[series] && d[x] === row[x]);
						if (inputRow && inputRow[y] !== null) {
							// This row already existed
							expect(row[y]).toEqual(inputRow[y]);
						} else {
							// This row was inserted
							expect(row[y]).toBe(0);
						}
					}
				}
			});
		}
	);
});
