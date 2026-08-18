import type { DataPoint } from './types';

/**
 * Calculates the minimum and maximum values for stacked charts
 * by summing values at each x position
 * @param data Array of objects containing the column values
 * @param x The key of the x-axis field
 * @param y The key of the y-axis field
 * @returns Object containing min and max values
 */
export function getStackedYMinMax(
	data: DataPoint[],
	x: string,
	y: string
): { min: number; max: number } {
	// For charts with series, calculate the sum at each x position
	const stackTotals = new Map<string | number | Date | null, number>();

	// Group by x value and sum the y values
	for (const row of data) {
		const xKey = row[x]?.toString() || '';
		const yValue = Number(row[y]) || 0;

		if (!stackTotals.has(xKey)) {
			stackTotals.set(xKey, yValue);
		} else {
			stackTotals.set(xKey, stackTotals.get(xKey)! + yValue);
		}
	}

	// Get min/max from the stack totals
	const stackValues = Array.from(stackTotals.values());
	return {
		min: Math.min(...stackValues),
		max: Math.max(...stackValues)
	};
}
