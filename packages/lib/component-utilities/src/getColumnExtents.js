import { tidy, summarize, min, max, median, mean, n, nDistinct, sum } from '@tidyjs/tidy';

/**
 *
 * @param {Record<string, unknown>[]} data
 * @param {string} columnName
 * @param {boolean} [isNumeric]
 * @returns {{ min?: number, max?: number, median?: number, mean?: number, count?: number, countDistinct?: number, sum?: number, maxDecimals: number, unitType: string }}
 */
export function getColumnUnitSummary(data, columnName, isNumeric = true) {
	const seriesExtents = tidy(
		data,
		isNumeric
			? summarize({
					count: n(columnName),
					countDistinct: nDistinct(columnName),
					min: min(columnName),
					max: max(columnName),
					median: median(columnName),
					mean: mean(columnName),
					sum: sum(columnName)
				})
			: summarize({ count: n(columnName), countDistinct: nDistinct(columnName) })
	)[0];

	// TODO try to use summarize spec in tidy
	const { maxDecimals, unitType } = summarizeUnits(data.map((row) => row[columnName]));

	return {
		min: seriesExtents.min,
		max: seriesExtents.max,
		median: seriesExtents.median,
		mean: seriesExtents.mean,
		count: seriesExtents.count,
		countDistinct: seriesExtents.countDistinct,
		sum: seriesExtents.sum,
		maxDecimals: maxDecimals,
		unitType: unitType
	};
}

/**
 *
 * @param {Record<string, unknown>[]} data
 * @param {string} column
 * @returns {[number?, number?]}
 */
export function getColumnExtentsLegacy(data, column) {
	const domainData = tidy(data, summarize({ min: min(column), max: max(column) }))[0];
	return [domainData.min, domainData.max];
}

/**
 *
 * @param {number[]} series
 * @returns {{ maxDecimals: number, unitType: string }}
 */
function summarizeUnits(series) {
	if (series === undefined || series === null || series.length === 0) {
		return {
			maxDecimals: 0,
			unitType: 'unknown'
		};
	} else {
		let maxDecimals = 0;

		for (const element of series) {
			const decimal_places = element?.toString().split('.')[1]?.length;
			if (decimal_places > maxDecimals) {
				maxDecimals = decimal_places;
			}
		}

		return {
			maxDecimals: maxDecimals,
			unitType: 'number'
		};
	}
}
