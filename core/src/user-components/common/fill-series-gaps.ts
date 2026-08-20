import type { DataPoint } from '../types';
import { untrack } from 'svelte';

/**
 * Options for configuring series gap filling
 */
export interface FillSeriesGapsOptions {
	data: DataPoint[];
	xColumn: string;
	yColumn: string;
	seriesColumn: string;
	sizeColumn?: string;
}

/**
 * Fills missing gaps in multi-series chart data to ensure all series have the same x values.
 *
 * **Why this is needed:**
 * ECharts uses `[x, y]` coordinate pairs for series data. When series have different x values,
 * this causes misalignment in stacked charts, tooltips, and grouped bars.
 *
 * **Performance:**
 * Uses early exits to avoid unnecessary work when fill is not needed.
 * All data iteration wrapped in untrack() for fast property access on Svelte proxies.
 *
 * @example
 * ```ts
 * const data = [
 *   { date: 'Jan', category: 'A', value: 10 },
 *   { date: 'Feb', category: 'A', value: 20 },
 *   { date: 'Jan', category: 'B', value: 15 }
 *   // Missing: Feb for category B
 * ];
 *
 * const filled = fillSeriesGaps({
 *   data,
 *   xColumn: 'date',
 *   yColumn: 'value',
 *   seriesColumn: 'category'
 * });
 * // Returns: [...original data, { date: 'Feb', category: 'B', value: null }]
 * ```
 */
export function fillSeriesGaps(options: FillSeriesGapsOptions): DataPoint[] {
	const { data, xColumn, yColumn, seriesColumn, sizeColumn } = options;

	if (!data || data.length === 0) {
		return data;
	}

	// Single pass: build all structures we might need
	// Use untrack() to avoid Svelte proxy overhead (100x faster on reactive data)
	const xSet = new Set<unknown>();
	const seriesSet = new Set<unknown>();
	const dataMap = new Map<string, DataPoint>();

	untrack(() => {
		for (const row of data) {
			xSet.add(row[xColumn]);
			seriesSet.add(row[seriesColumn]);
			dataMap.set(`${row[xColumn]}|${row[seriesColumn]}`, row);
		}
	});

	// Early exit: single series doesn't need fill
	if (seriesSet.size <= 1) {
		return data;
	}

	// Early exit: grid already complete (all x × series combinations exist)
	if (data.length === xSet.size * seriesSet.size) {
		return data;
	}

	// Fill is needed - create complete x × series grid
	const allXValues = [...xSet];
	const seriesValues = [...seriesSet];
	const filledData: DataPoint[] = [];

	for (const xValue of allXValues) {
		for (const seriesValue of seriesValues) {
			const key = `${xValue}|${seriesValue}`;
			const existingRow = dataMap.get(key);

			if (existingRow) {
				filledData.push(existingRow);
			} else {
				// Create filled row with null values
				const filledRow = {
					[xColumn]: xValue,
					[seriesColumn]: seriesValue,
					[yColumn]: null
				} as DataPoint;

				if (sizeColumn) {
					filledRow[sizeColumn] = null;
				}

				filledData.push(filledRow);
			}
		}
	}

	return filledData;
}
