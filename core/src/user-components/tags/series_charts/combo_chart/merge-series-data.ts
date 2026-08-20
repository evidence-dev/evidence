/**
 * Utility functions for merging series data for export.
 * Extracted for testability and reusability.
 */

export interface SeriesDataInput {
	/** The rows of data for this series */
	rows: Record<string, unknown>[];
	/** Column metadata from the query result */
	columns: Array<{ name: string; jsType: string; clickhouseType?: string }>;
	/** The SQL column name for the y-axis value */
	yColumnName: string | undefined;
	/** The display name for the y-axis (formatted for export headers) */
	yDisplayName: string | undefined;
	/** The SQL column name for the series grouping (optional) */
	seriesColumnName: string | undefined;
	/** Format string for the y values */
	fmt: string | undefined;
}

export interface MergedSeriesResult {
	/** Merged rows with unique column names */
	rows: Record<string, unknown>[];
	/** Column metadata for export */
	columns: Array<{ name: string; jsType: string; clickhouseType?: string; fmt?: string }>;
}

/**
 * Generates a unique export column name by appending a suffix if the name already exists.
 * Uses a count map to track occurrences of each base name.
 *
 * @param baseName - The base display name for the column
 * @param countMap - Map tracking how many times each name has been used
 * @returns A unique column name (baseName for first occurrence, baseName_2, baseName_3, etc. for subsequent)
 */
export function getUniqueColumnName(baseName: string, countMap: Map<string, number>): string {
	const count = countMap.get(baseName) ?? 0;
	countMap.set(baseName, count + 1);
	return count === 0 ? baseName : `${baseName}_${count + 1}`;
}

/**
 * Looks up the JavaScript type of the x column from the first series that has it.
 *
 * @param seriesData - Array of series data inputs
 * @param xColumnName - The name of the x column to look up
 * @returns The jsType of the x column, or 'string' if not found
 */
export function getXColumnType(seriesData: SeriesDataInput[], xColumnName: string): string {
	for (const series of seriesData) {
		const xCol = series.columns.find((c) => c.name === xColumnName);
		if (xCol?.jsType) {
			return xCol.jsType;
		}
	}
	return 'string';
}

function getXColumnMeta(seriesData: SeriesDataInput[], xColumnName: string): SeriesDataInput['columns'][number] | undefined {
	for (const series of seriesData) {
		const xCol = series.columns.find((c) => c.name === xColumnName);
		if (xCol) return xCol;
	}
	return undefined;
}

/**
 * Merges data from multiple series into a single dataset suitable for export.
 * Handles:
 * - Deduplication of column names when multiple series have the same display name
 * - Merging rows by x-value (and series value if present)
 * - Preserving all y-values from different series in separate columns
 *
 * @param xColumnName - The name of the x-axis column
 * @param seriesData - Array of series data to merge
 * @returns Merged rows and column metadata, or null if no valid data
 */
export function mergeSeriesData(
	xColumnName: string,
	seriesData: SeriesDataInput[]
): MergedSeriesResult | null {
	if (!xColumnName || seriesData.length === 0) {
		return null;
	}

	const xMeta = getXColumnMeta(seriesData, xColumnName);

	const allColumns: Array<{ name: string; jsType: string; clickhouseType?: string; fmt?: string }> = [
		{ name: xColumnName, jsType: xMeta?.jsType ?? 'string', clickhouseType: xMeta?.clickhouseType }
	];

	// Build a map of (x-value, series-value) -> merged row
	const mergedData = new Map<string, Record<string, unknown>>();

	// Track display name occurrences to generate unique export column names
	// This prevents data loss when multiple series have the same display name
	const displayNameCounts = new Map<string, number>();

	// Track what export column name each series gets (for row merging)
	const seriesExportNames: string[] = [];

	for (const series of seriesData) {
		const { rows, columns, yColumnName, yDisplayName, seriesColumnName, fmt } = series;

		if (!yColumnName || rows.length === 0) {
			seriesExportNames.push(''); // placeholder for skipped series
			continue;
		}

		// Use display name for better readability, fall back to column name
		const baseDisplayName = yDisplayName ?? yColumnName;
		// Track baseDisplayName occurrences (not yColumnName) to ensure unique export column names
		// This prevents duplicates when different SQL aliases produce the same display name
		const exportColumnName = getUniqueColumnName(baseDisplayName, displayNameCounts);
		seriesExportNames.push(exportColumnName);

		// Add y column with unique export name
		const yColumnMeta = columns.find((c) => c.name === yColumnName);
		if (yColumnMeta) {
			allColumns.push({
				name: exportColumnName,
				jsType: yColumnMeta.jsType,
				clickhouseType: yColumnMeta.clickhouseType,
				fmt
			});
		}

		// Also add series column if present (only once)
		if (seriesColumnName) {
			const seriesColMeta = columns.find((c) => c.name === seriesColumnName);
			if (seriesColMeta && !allColumns.some((c) => c.name === seriesColumnName)) {
				allColumns.push({
					name: seriesColumnName,
					jsType: seriesColMeta.jsType,
					clickhouseType: seriesColMeta.clickhouseType
				});
			}
		}

		// Merge rows by x-value AND series value (if present)
		// This ensures rows with same x but different series values are kept separate
		for (const row of rows) {
			const xValue = row[xColumnName];
			const seriesValue = seriesColumnName ? row[seriesColumnName] : null;
			// Create composite key: x-value + series-value (if present)
			const key = seriesValue !== null ? `${xValue}\0${seriesValue}` : String(xValue);
			const existing = mergedData.get(key) ?? { [xColumnName]: xValue };

			// Copy y value using unique export column name to avoid overwrites
			if (yColumnName in row) {
				existing[exportColumnName] = row[yColumnName];
			}
			if (seriesColumnName && seriesColumnName in row) {
				existing[seriesColumnName] = row[seriesColumnName];
			}

			mergedData.set(key, existing);
		}
	}

	return {
		rows: Array.from(mergedData.values()),
		columns: allColumns
	};
}
