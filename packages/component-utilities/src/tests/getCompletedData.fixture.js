import { faker } from '@faker-js/faker';

// Configuration for fixture generation
// Can be no less than 2
const SERIES_LEN = 100
// Can be no more than 5 
const SERIES_COUNT = 5

/** @typedef {'a'|'b'|'c'|'d'|'e'} MockSeries */

/** @type {MockSeries[]} */
const seriesNames = ['a', 'b', 'c', 'd', 'e'];



/**
 * @returns { { data: { series: MockSeries, value: number, time: number }[], series: Record<MockSeries, { interval: number }> }  }
 */
export const genSeries = ({ xHasGaps = false, yHasNulls = false, seriesAlwaysExists = true }) => {
	const data = [];

	const len = faker.number.int({ min: 2, max: SERIES_LEN });
	const series = Object.fromEntries(
		new Array(faker.number.int({ min: SERIES_COUNT === 1 ? 1 : 2, max: SERIES_COUNT }))
			.fill(null)
			.map((_, i) => [seriesNames[i], { len, interval: faker.number.int({ min: 1, max: 20 }), offset: faker.number.int({min: -100, max: 100}) }])
	);

	for (let i = 0; i < len; i++) {
		for (const [seriesName, d] of Object.entries(series)) {
			data.push({
				series: seriesName,
				value: faker.number.float({min: -1000, max: 1000}),
				time: (i * d.interval) + d.offset
			});
		}
	}
	if (xHasGaps) {
		const gapsToCreate = faker.number.int({ min: Math.ceil(len / 6), max: Math.ceil(len / 3) });
		for (let i = 0; i < gapsToCreate; i++) {
			const targetIdx = faker.number.int({ min: 0, max: data.length - 1 });
			data.splice(targetIdx, 1);
		}
	}
	if (yHasNulls) {
		const nullsToCreate = faker.number.int({ min: Math.ceil(len / 6), max: Math.ceil(len / 3) });
		for (let i = 0; i < nullsToCreate; i++) {
			const targetIdx = faker.number.int({ min: 0, max: data.length - 1 });
			data[targetIdx].value = null;
		}
	}
	if (!seriesAlwaysExists) {
		const emptiesToCreate = faker.number.int({ min: Math.ceil(len / 10), max: len });
		for (let i = 0; i < emptiesToCreate; i++) {
			data.push({
				series: null,
				value: 0,
				time: i
			});
		}
	}

	data.sort((a, b) => a.series?.charCodeAt(0) ?? -1 - b.series?.charCodeAt(0) ?? -1);

	return {
		series,
		data
	};
};
