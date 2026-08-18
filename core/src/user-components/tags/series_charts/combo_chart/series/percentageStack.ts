import type { SeriesOption } from 'echarts';

type DataPoint = (string | number | Date | undefined)[];

/**
 * Symbol to store original values on series config for tooltip access
 */
export const ORIGINAL_VALUES_KEY = Symbol('originalValues');

/**
 * Extended series option with original values for percentage stacking
 */
export type PercentageSeriesOption = SeriesOption & {
	[ORIGINAL_VALUES_KEY]?: Map<string, number>;
};

/**
 * Transforms series data to percentage values for 100% stacked charts.
 *
 * For each x-value, calculates the total across all series and converts
 * each series' value to a percentage of that total.
 *
 * @param seriesConfigs - Array of ECharts series configurations
 * @returns Transformed series configurations with percentage values
 */
export function transformToPercentageStack(
	seriesConfigs: SeriesOption[]
): PercentageSeriesOption[] {
	if (seriesConfigs.length === 0) return [];

	// Step 1: Calculate totals for each x-value across all series
	const totals = new Map<string, number>();

	for (const series of seriesConfigs) {
		const data = series.data as DataPoint[] | undefined;
		if (!data) continue;

		for (const point of data) {
			if (!Array.isArray(point)) continue;
			const xValue = String(point[0]);
			const yValue = typeof point[1] === 'number' ? point[1] : 0;
			totals.set(xValue, (totals.get(xValue) ?? 0) + yValue);
		}
	}

	// Step 2: Transform each series' data to percentages
	return seriesConfigs.map((series) => {
		const data = series.data as DataPoint[] | undefined;
		if (!data) return series as PercentageSeriesOption;

		// Store original values for tooltip display
		const originalValues = new Map<string, number>();

		const transformedData = data.map((point) => {
			if (!Array.isArray(point)) return point;

			const xValue = String(point[0]);
			const yValue = typeof point[1] === 'number' ? point[1] : 0;
			const total = totals.get(xValue) ?? 0;

			// Store original value keyed by x-value
			// For multi-series, we'll use series name + x-value as key
			originalValues.set(xValue, yValue);

			// Calculate percentage as decimal 0-1 (handle division by zero)
			// SSF/Excel format codes with % will multiply by 100 for display
			const percentage = total > 0 ? yValue / total : 0;

			// Return new point with percentage value, preserving other elements (like size)
			return [point[0], percentage, ...point.slice(2)];
		});

		return {
			...series,
			data: transformedData,
			[ORIGINAL_VALUES_KEY]: originalValues
		} as PercentageSeriesOption;
	});
}

/**
 * Gets the original (non-percentage) value for a data point in a percentage-stacked series.
 *
 * @param series - The series option (may have original values attached)
 * @param xValue - The x-value to look up
 * @returns The original value, or undefined if not found
 */
export function getOriginalValue(
	series: SeriesOption | PercentageSeriesOption,
	xValue: string | number | Date
): number | undefined {
	const originalValues = (series as PercentageSeriesOption)[ORIGINAL_VALUES_KEY];
	if (!originalValues) return undefined;
	return originalValues.get(String(xValue));
}
