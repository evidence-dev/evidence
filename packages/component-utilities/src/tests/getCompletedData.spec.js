import { describe, it, expect } from 'vitest';
import getCompletedData from '../getCompletedData';
import { genSeries } from './getCompletedData.fixture';
import { MissingYCase, NullFirstRowCase, FullNullCase } from './getCompletedData.fixture.manual';

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

const simple = false;

const fixturePermutations = {
	xHasGaps: simple ? [true, false] : [true, false],
	yHasNulls: simple ? [true, false] : [true, false],
	seriesAlwaysExists: simple ? [true, false] : [true, false],
	xType: simple ? ['date'] : ['date', 'number', 'category'],
	keys: simple
		? [undefined, { x: 'someX', y: 'someY', series: 'someSeries' }]
		: [undefined, { x: 'someX', y: 'someY', series: 'someSeries' }]
};
/**
 * @typedef {Object} SeriesFixture
 * @property {import("./getCompletedData.fixture.js").GenSeriesResult["data"]} data
 * @property { 'date' | 'number' } xType
 * @property {boolean} seriesAlwaysExists
 * @property {boolean} yHasNulls
 * @property {boolean} xHasgaps
 * @property {boolean} manual
 * @property {import("./getCompletedData.fixture.js").GenSeriesResult["keys"]} keys
 * @property {import("./getCompletedData.fixture.js").GenSeriesResult["series"]} series
 */

/**
 * @param {SeriesFixture} opts
 */
const testSuite = (opts) => {
	const { data, keys, stringify } = opts;

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
			const targetX = row[keys.x];

			const target = result.find(
				(r) => r[keys.series] === row[keys.series] && r[keys.x].toString() === targetX.toString()
			);

			expect(target).toBeDefined();
			expect(target[keys.y]).toBeCloseTo(0);
		}
	});

	it.each([
		{ fillX: true, nullsZero: true },
		{ fillX: true, nullsZero: false },
		{ fillX: false, nullsZero: false },
		{ fillX: false, nullsZero: true }
	])(
		`Returns the correct x value type (xType = ${opts.xType}, fillX = $fillX, nullsZero = $nullsZero)`,
		({ fillX, nullsZero }) => {
			// Verify precondition
			const result = getCompletedData(data, keys.x, keys.y, keys.series, fillX, nullsZero);
			for (const row of result) {
				if (stringify) expect(typeof row[keys.x]).toEqual('string');
				else
					switch (opts.xType) {
						case 'number':
							expect(typeof row[keys.x]).toEqual('number');
							break;
						case 'date':
							expect(row[keys.x]).toBeInstanceOf(Date);
							break;
						default:
							expect(typeof row[keys.x]).toEqual('string');
							break;
					}
			}
		}
	);

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
	// if (opts.xType !== 'date')
	it('contains series each with identical lengths', () => {
		const result = getCompletedData(data, keys.x, keys.y, keys.series, false, true);
		/** @type {any[][]} */
		let groupedSeries = [];

		for (const seriesName of Array.from(new Set(result.map((r) => r[keys.series])))) {
			const seriesItems = result.filter((d) => d[keys.series] === seriesName);
			groupedSeries.push(seriesItems);
		}

		expect(groupedSeries.length, 'Must have at least one grouped series').toBeGreaterThan(0);
		expect(groupedSeries[0].length, 'Series must have more than one row').toBeGreaterThan(0);

		for (const s of groupedSeries) {
			expect(s.length, 'Series lengths must all be equal').toEqual(groupedSeries[0].length);
		}
	});
	it('contains series each with identical x values', () => {
		const result = getCompletedData(data, keys.x, keys.y, keys.series, true, true);

		/** @type {any[][]} */
		let groupedSeries = [];

		for (const seriesName of Array.from(new Set(result.map((r) => r[keys.series])))) {
			const seriesItems = result.filter((d) => d[keys.series] === seriesName);
			groupedSeries.push(seriesItems);
		}

		for (const series of groupedSeries)
			series.sort((a, b) => a[keys.x].toString().localeCompare(b[keys.x])); // sort by x value

		for (let seriesIdx = 1; seriesIdx < groupedSeries.length; seriesIdx++) {
			const series = groupedSeries[seriesIdx];
			for (let i = 0; i < groupedSeries[0].length; i++) {
				expect(series[i][keys.x]).toEqual(groupedSeries[0][i][keys.x]);
			}
		}
	});

	it('returns the original data if series is not defined', () => {
		const { x, y } = keys;
		const result = getCompletedData(data, x, y, undefined, false, false);

		expect(Array.from(data)).toEqual(expect.arrayContaining(result));
	});

	it('fills missing x-axis values with null if fillX is set and not nullsZero', () => {
		const { x, y, series } = keys;

		const result = getCompletedData(data, x, y, series, false, true);
		// Expect specific behavior here based on your function's logic
		for (const seriesName in series) {
			for (const row of result.filter((r) => r[series] === seriesName)) {
				const inputRow = data.find((d) => d[series] === row[series] && d[x] === row[x]);
				if (inputRow) {
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
};

describe.each(fixturePermutations.xHasGaps.map((v) => ({ xHasGaps: v })))(
	'xHasGaps: $xHasGaps',
	({ xHasGaps }) => {
		describe.each(fixturePermutations.yHasNulls.map((v) => ({ yHasNulls: v })))(
			'yHasNulls: $yHasNulls',
			({ yHasNulls }) => {
				describe.each(
					fixturePermutations.seriesAlwaysExists.map((v) => ({ seriesAlwaysExists: v }))
				)('seriesAlwaysExists: $seriesAlwaysExists', ({ seriesAlwaysExists }) => {
					describe.each(fixturePermutations.keys.map((v) => ({ keys: v })))(
						'{ x: $keys.x, y: $keys.y, series: $keys.series}',
						({ keys }) => {
							describe.each([{ stringify: true }, { stringify: false }])(
								'stringify: $stringify',
								({ stringify }) => {
									describe.each(fixturePermutations.xType.map((v) => ({ xType: v })))(
										'xType: $xType',
										({ xType }) => {
											let mockSeries = genSeries({
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
											});

											let values = mockSeries.data.map((d) => ({
												...d,
												[mockSeries.keys.x]: stringify
													? d[mockSeries.keys.x].toLocaleString()
													: d[mockSeries.keys.x]
											}));

											testSuite({
												xHasGaps,
												yHasNulls,
												seriesAlwaysExists,
												xType,
												stringify,
												keys: mockSeries.keys,
												series: mockSeries.series,
												data: values,
												description: ''
											});
										}
									);
								}
							);
						}
					);
				});
			}
		);
	}
);

// /*
//     This is responsible for generating a variety of scenarios that the function may encounter
//     One factor is if the x-axis has values in all positions
//     One factor is if the y-axis will always have a value, or if it can be null
//     One factor is if the series field is always set, or if it is sometimes set to null
//  */
// for (const xHasGaps of fixturePermutations.xHasGaps) {
// 	for (const yHasNulls of fixturePermutations.yHasNulls)
// 		for (const seriesAlwaysExists of fixturePermutations.seriesAlwaysExists)
// 			for (const xType of fixturePermutations.xType)
// 				for (const keys of fixturePermutations.keys) {
// 					for (const stringify of [true, false]) {
// 						const mockSeries = genSeries({
// 							xHasGaps,
// 							yHasNulls,
// 							seriesAlwaysExists,
// 							xType,
// 							keys,
// 							minSeriesLen: 2,
// 							maxSeriesLen: 2,
// 							maxSeriesCount: 2,
// 							maxInterval: 1,
// 							maxOffset: 0
// 						});

// 						const values = mockSeries.data.map((d) => ({
// 							...d,
// 							[mockSeries.keys.x]: stringify
// 								? d[mockSeries.keys.x].toString()
// 								: d[mockSeries.keys.x]
// 						}));
// 						series.push({
// 							description: `(Array) xType = "${xType}", xHasGaps = ${xHasGaps}, yHasNulls = ${yHasNulls}, seriesAlwaysExists = ${seriesAlwaysExists}, keys = "${JSON.stringify(
// 								keys
// 							)}"`,
// 							xHasGaps,
// 							yHasNulls,
// 							seriesAlwaysExists,
// 							xType,
// 							keys: mockSeries.keys,
// 							series: mockSeries.series,
// 							manual: false,
// 							data: values,
// 							stringify
// 						});
// 						const queryStore = new QueryStore('', undefined, 'test', {
// 							disableCache: true,
// 							initialData: values
// 						});
// 						series.push({
// 							description: `(QueryStore) xType = "${xType}", xHasGaps = ${xHasGaps}, yHasNulls = ${yHasNulls}, seriesAlwaysExists = ${seriesAlwaysExists}, keys = "${JSON.stringify(
// 								keys
// 							)}"`,
// 							xHasGaps,
// 							yHasNulls,
// 							seriesAlwaysExists,
// 							xType,
// 							keys: mockSeries.keys,
// 							series: mockSeries.series,
// 							manual: false,
// 							data: queryStore.value(),
// 							stringify
// 						});
// 					}
// 				}
// }
testSuite({
	description: '(Manual) Manual gap values injected',
	...MissingYCase
});

// series.sort((a, b) => a.description.localeCompare(b.description));

// describe('getCompletedData', () => {
// 	describe.each(series)(
// 		'$description',
// 		/**
// 		 * @param {SeriesFixture} opts
// 		 */

// 	);
// });

describe('(Manual) First row has null X', () => {
	testSuite({
		...NullFirstRowCase
	});
});

describe('(Manual) All rows have null X', () => {
	const { data, keys } = FullNullCase;
	it('should throw', () => {
		expect(() => getCompletedData(data, keys.x, keys.y, keys.series, false, false)).toThrowError(
			`Column '${keys.x}' is entirely null`
		);
	});
});
