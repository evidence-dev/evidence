import { generateRandomPointsWithFaker } from '../lib.mjs';

const PeriodLookup = {
	day: 0,
	week: 0,
	month: 0
};

/**
 *
 * @param {import("zod").infer<typeof import("../schemas/series.schema.mjs").NumericSeriesSchema>} opts
 * @param {number} rowCount
 * @param {import("@faker-js/faker").Faker} faker
 * @param {import("@faker-js/faker").Faker} biasedFaker
 */
export const genNumericSeries = (opts, rowCount, faker, biasedFaker) => {
	/** @type {Array<Record<string, boolean | string | Date | number | null>>} */
	let data = [];
	const xOpts = opts.columns.x;
	const yOpts = opts.columns.y;
	const sOpts = opts.columns.series;
	const _faker = yOpts.withBias ? biasedFaker : faker;

	let offset =
		xOpts.type === 'number'
			? faker.number.int({ min: 0, max: xOpts.maxOffset }) // Numeric Offset
			: PeriodLookup[xOpts.period] * rowCount; // x periods (e.g 5 days ago)

	/** @type {Array<string|boolean|Date|number>} */
	const series = new Array(sOpts.count)
		.fill(null)
		// @ts-expect-error
		.map(() => _faker[sOpts.category][sOpts.item](sOpts.options));

	const buildRow = (
		/** @type {string | number | boolean | Date | null} */ s,
		/** @type {string | number | boolean | Date} */ xVal
	) => {
		/** @type {typeof data[number]} */
		const record = {};

		if (s !== null) record[sOpts.name] = s;
		record[xOpts.name] = xVal;

		// @ts-expect-error
		record[yOpts.name] = _faker[yOpts.category][yOpts.item](...yOpts.options);
		return record;
	};

	const getXVal = (/** @type {number} */ i) => {
		let xVal;

		switch (xOpts.type) {
			case 'number':
				xVal = i + offset;
				break;
			case 'date':
				xVal = new Date(
					new Date().getTime() - (rowCount - i) /* front to back */ * PeriodLookup[xOpts.period]
				);
		}
		return xVal;
	};

	for (let i = 0; i < rowCount; i++) {
		for (const s of series) {
			data.push(buildRow(s, getXVal(i)));
		}
	}

	if (xOpts.gaps) {
		const gapsToCreate = Math.floor(data.length * (xOpts.gaps === true ? 0.5 : xOpts.gaps));
		for (let i = 0; i < gapsToCreate; i++) {
			const targetIdx = _faker.number.int({ min: 0, max: data.length - 1 });
			data.splice(targetIdx, 1);
		}
	}

	if (yOpts.nulls) {
		const nullsToCreate = Math.floor(data.length * (yOpts.nulls === true ? 0.5 : yOpts.nulls));

		for (let i = 0; i < nullsToCreate; i++) {
			const targetIdx = _faker.number.int({ min: 0, max: data.length - 1 });
			data[targetIdx][yOpts.name] = null;
		}
	}

	if (sOpts.alwaysExists === false || typeof sOpts.alwaysExists === 'number') {
		const empties = Math.floor(
			rowCount * (sOpts.alwaysExists === false ? 0.5 : sOpts.alwaysExists)
		);

		const points = generateRandomPointsWithFaker(empties, 0, rowCount, faker);

		/** @type {typeof data} */
		const emptyPoints = [];
		for (const i of points) {
			emptyPoints.push(buildRow(null, getXVal(i)));
		}
		data.push(...emptyPoints);
	}

	data.sort((a, b) => {
		const aVal = a[xOpts.name];
		const bVal = b[xOpts.name];
		if (aVal === null) return -1;
		if (bVal === null) return 1;

		if (aVal instanceof Date && bVal instanceof Date) {
			return aVal.getTime() - bVal.getTime();
		} else if (typeof aVal === 'number' && typeof bVal === 'number') {
			return aVal - bVal;
		} else {
			return 0;
		}
	});

	return data;
};
