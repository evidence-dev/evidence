import { faker } from '@faker-js/faker';

/** @typedef {'a'|'b'|'c'|'d'|'e'} MockSeries */

/** @type {MockSeries[]} */
const seriesNames = ['a', 'b', 'c', 'd', 'e'];

/**
 * @typedef {Object} GenSeriesOpts
 * @property {boolean} xHasGaps Determines if the x axis will have all expected values
 * @property {boolean} yHasNulls Determines if the y axis will be nullable
 * @property {boolean} seriesAlwaysExists
 * @property {number} [minSeriesLen] Min length of each series
 * @property {number} [maxSeriesLen] Max length of each series
 * @property {number} [minSeriesCount] Min number of series
 * @property {number} [maxSeriesCount] Max number of series
 * @property {number} [minInterval] Min interval between x values (e.g. interval of 2 is 0,2,4)
 * @property {number} [maxInterval] Max interval between x values (e.g. interval of 2 is 0,2,4)
 * @property {number} [maxOffset] Max offset for initial x value  (e.g. interval of 2, offset of 1 is 1,3,5)
 * @property {'number' | 'date' | 'categories'} [xType] determines the type of the x axis
 */

/** @param  */
const genNumericSeries = ({
	xHasGaps = false,
	yHasNulls = false,
	seriesAlwaysExists = true,
	minSeriesLen = 2,
	maxSeriesLen = 10,
	minInterval = 1,
	maxInterval = 5,
	minSeriesCount = 2,
	maxSeriesCount = 5,
	maxOffset = 10,
	xType = 'number'
} = {}) => {
	const data = [];

	const len = faker.number.int({ min: minSeriesLen, max: maxSeriesLen });
	const series = Object.fromEntries(
		new Array(
			faker.number.int({
				min: minSeriesCount,
				max: maxSeriesCount < minSeriesCount ? minSeriesCount : maxSeriesCount
			})
		)
			.fill(null)
			.map((_, i) => [
				seriesNames[i],
				{
					len,
					interval: faker.number.int({ min: minInterval, max: maxInterval }),
					offset: faker.number.int({ min: -1 * maxOffset, max: maxOffset })
				}
			])
	);
	for (const [seriesName, d] of Object.entries(series)) {
		const initialValue = xType === 'number' ? d.offset : new Date();
		const genTime = (i) =>
			xType === 'number'
				? initialValue + i * d.interval
				: new Date(initialValue.getTime() + i * d.interval * 24 * 60 * 60 * 60 * 1000);

		for (let i = 0; i < len; i++) {
			data.push({
				series: seriesName,
				value: faker.number.float({ min: -1000, max: 1000 }),
				time: genTime(i)
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

		const initialValue = xType === 'number' ? 0 : faker.date.past({ years: 2 });
		const genTime = (i) =>
			xType === 'number'
				? initialValue + i * 4
				: new Date(initialValue.getTime() + i * 24 * 60 * 60 * 60 * 1000);

		for (let i = 0; i < emptiesToCreate; i++) {
			data.push({
				series: null,
				value: faker.number.float({ min: -1000, max: 1000 }),
				time: genTime(i)
			});
		}
	}

	data.sort((a, b) => {
		const deltaTime = a.time - b.time;
		if (deltaTime !== 0) return deltaTime;
		const deltaValue = a.value - b.value;
		if (deltaValue !== 0) return deltaValue;
		const deltaSeries = a.series?.charCodeAt(0) ?? -1 - b.series?.charCodeAt(0) ?? -1;
		if (deltaSeries !== 0) return deltaSeries;
		return 0;
	});

	return {
		series,
		data
	};
};

/** @param {GenSeriesOpts} cfg */
const getCatagoricalSeries = ({
	minSeriesLen,
	maxSeriesLen,
	minSeriesCount,
	maxSeriesCount
} = {}) => {
	const seriesLength = faker.number.int({ min: minSeriesLen, max: maxSeriesLen });
	const seriesCount = faker.number.int({ min: minSeriesCount, max: maxSeriesCount });
	const categories = new Array(seriesLength).fill(null).map(() => faker.location.streetAddress());
	const series = new Array(seriesCount).fill(null).map(() => faker.company.name());

	const data = series.reduce((a, v) => {
		for (const category of categories) {
			a.push({
				series: v,
				category: category,
				value: faker.number.int({ min: 0, max: 10000 })
			});
		}
		return a;
	}, []);

	return {
		series: Object.fromEntries(
			series.map((seriesName) => [seriesName, { len: seriesLength, offset: 0, interval: 1 }])
		),
		data
	};
};

/**
 * @param {GenSeriesOpts} cfg
 * @returns { { data: { series: MockSeries, value: number, time: number }[], series: Record<MockSeries, { interval: number }> }  }
 */
export const genSeries = (cfg = {}) => {
	let v;
	switch (cfg.xType) {
		case 'date':
		case 'number':
		default:
			v = genNumericSeries(cfg);
			break;
		case 'categories':
			v = getCatagoricalSeries(cfg);
			break;
	}
	return v;
};
