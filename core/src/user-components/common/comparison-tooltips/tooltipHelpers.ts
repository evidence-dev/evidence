import { formatValue } from '../../formatValue';

// Helper function to construct target comparison column names
export function constructVsTargetColumns(
	resultField: string,
	comparisonId?: string
): {
	current?: string;
	target?: string;
	abs?: string;
	pct?: string;
} {
	if (!resultField) return {};

	// if comparisonId is provided, it means the resultField is the correct current value
	// if it's not provided, it means the tooltip is reading from a table cell, so we need to construct the baseId
	if (comparisonId) {
		return {
			current: resultField,
			target: `${comparisonId}_compared_value`,
			abs: `${comparisonId}_abs`,
			pct: `${comparisonId}_pct`
		};
	} else {
		// Extract the base comparison ID by removing suffixes
		const baseId = resultField.replace(/_compared_value$|_abs$|_pct$/, '');

		return {
			current: baseId,
			target: `${baseId}_compared_value`,
			abs: `${baseId}_abs`,
			pct: `${baseId}_pct`
		};
	}
}

// Helper function to construct temporal comparison column names
export function constructTemporalColumns(
	resultField: string,
	comparisonId?: string
): {
	current?: string;
	value?: string;
	abs?: string;
	pct?: string;
} {
	if (!resultField) return {};

	// if comparisonId is provided, it means the resultField is the correct current value
	// if it's not provided, it means the tooltip is reading from a table cell, so we need to construct the baseId
	if (comparisonId) {
		return {
			current: resultField,
			value: `${comparisonId}_compared_value`,
			abs: `${comparisonId}_abs`,
			pct: `${comparisonId}_pct`
		};
	} else {
		// Extract the base comparison ID by removing suffixes
		const baseId = resultField.replace(/_abs$|_pct$|_compared_value$/, '');

		return {
			current: baseId,
			value: `${baseId}_compared_value`,
			abs: `${baseId}_abs`,
			pct: `${baseId}_pct`
		};
	}
}

// Helper function to safely get and format a value from the row or raw data
export function getFormattedValue(
	columnName: string | undefined,
	rawData: Record<string, unknown>[] | undefined,
	row: Record<string, unknown>,
	dimensionFields?: string[],
	pivotFields?: string[],
	currentColumnKey?: string,
	measures_first = false,
	format?: string
): string {
	if (!columnName || !rawData) return 'N/A';

	// Create filter criteria from current row's dimension and pivot values
	const filterCriteria: Record<string, unknown> = {};

	// Add dimension values from current row
	dimensionFields?.forEach((dim) => {
		const value = row[dim];
		filterCriteria[dim] = value;
	});

	// Add pivot values - need to infer from currentColumnKey for columns without "::" separator
	if (pivotFields && pivotFields.length > 0) {
		if (currentColumnKey && currentColumnKey.includes('::')) {
			// Extract pivot values from column key, accounting for measures_first
			// When measures_first=true: "sum(sales)::2021-01-01::__ev_comparison__..."
			// When measures_first=false: "2021-01-01::__ev_comparison__sum(sales)..."
			const pivotParts = measures_first
				? currentColumnKey.split('::').slice(1, 1 + pivotFields.length) // Skip measure, take next N
				: currentColumnKey.split('::').slice(0, pivotFields.length); // Take first N

			pivotFields.forEach((pivotField, index) => {
				if (pivotParts[index]) {
					filterCriteria[pivotField] = pivotParts[index];
				}
			});
		} else {
			// For columns without "::" (e.g., total columns), pivots should be null/undefined
			// ClickHouse represents null dates as '1970-01-01' in grouping sets
			pivotFields.forEach((pivotField) => {
				filterCriteria[pivotField] = null;
			});
		}
	}

	// Find matching row in raw data
	const matchingRow = rawData.find((rawRow) => {
		return Object.entries(filterCriteria).every(([key, value]) => {
			const rawValue = rawRow[key];

			// Handle null/undefined values and 'Total' display values - both should match null-like raw data
			if (value === null || value === undefined || value === 'Total') {
				// ClickHouse uses '1970-01-01' as placeholder for null dates in grouping sets
				const isNullLike =
					rawValue === null ||
					rawValue === undefined ||
					rawValue === '' ||
					rawValue === '1970-01-01' ||
					rawValue === 0; // ClickHouse GROUPING SETS uses 0 for null dimensions
				return isNullLike;
			}

			const matches = rawValue === value;
			return matches;
		});
	});

	if (matchingRow && columnName in matchingRow) {
		const value = matchingRow[columnName];
		if (value !== null && value !== undefined) {
			const defaultFormat = columnName.includes('_pct') ? 'pct1' : 'num';
			return formatValue(value, format || defaultFormat, String(value));
		}
	}

	return 'N/A';
}

// Build tooltip content based on comparison type
export function buildTooltipContent(
	comparisonType: 'target' | 'prior year' | 'prior period' | 'benchmark',
	row: Record<string, unknown>,
	rawData?: Record<string, unknown>[],
	dimensionFields?: string[],
	pivotFields?: string[],
	comparisonId?: string,
	resultField?: string,
	currentColumnKey?: string,
	measures_first = false,
	customFormat?: string,
	absFormat?: string,
	pctFormat?: string,
	hidePct = false
): { title: string; rows: Array<{ label: string; value: string }> } {
	const getFormattedValueWrapper = (columnName: string | undefined) => {
		// Smart defaults based on column type
		let effectiveFormat: string | undefined;
		if (columnName?.includes('_pct')) {
			effectiveFormat = pctFormat || 'pct1';
		} else if (columnName?.endsWith('_abs')) {
			effectiveFormat = absFormat || customFormat || 'num0';
		} else {
			effectiveFormat = customFormat;
		}

		return getFormattedValue(
			columnName,
			rawData,
			row,
			dimensionFields,
			pivotFields,
			currentColumnKey,
			measures_first,
			effectiveFormat
		);
	};

	if (comparisonType === 'target') {
		const columns = constructVsTargetColumns(resultField || '', comparisonId);

		const current = getFormattedValueWrapper(columns.current);
		const target = getFormattedValueWrapper(columns.target);
		const changeAbs = getFormattedValueWrapper(columns.abs);
		const changePct = getFormattedValueWrapper(columns.pct);

		// Build rows array with the 4 core comparison values
		const rows: { label: string; value: string }[] = [
			{ label: 'Actual', value: current },
			{ label: 'Target', value: target },
			{ label: 'separator', value: '' }, // Special separator row
			{ label: 'Change (abs)', value: changeAbs }
		];

		if (!hidePct) {
			rows.push({ label: 'Change (%)', value: changePct });
		}

		return {
			title: 'vs Target',
			rows
		};
	} else if (comparisonType === 'prior year' || comparisonType === 'prior period') {
		const columns = constructTemporalColumns(resultField || '', comparisonId);

		const currentValue = getFormattedValueWrapper(columns.current);
		const comparisonValue = getFormattedValueWrapper(columns.value);
		const changeAbs = getFormattedValueWrapper(columns.abs);
		const changePct = getFormattedValueWrapper(columns.pct);

		// Get date range values to use as labels
		let currentLabel = 'Current';
		let periodLabel = comparisonType === 'prior year' ? 'Prior Year' : 'Prior Period';

		if (rawData && (comparisonId || resultField)) {
			// Determine the comparison ID - either provided or extract from resultField
			const effectiveComparisonId =
				comparisonId ||
				(() => {
					if (!resultField) return undefined;
					// Extract the base comparison ID by removing suffixes
					const baseId = resultField.replace(/_abs$|_pct$|_compared_value$/, '');
					return baseId.startsWith('__ev_') ? baseId : undefined;
				})();

			if (effectiveComparisonId) {
				// Get date range values from the actual query results
				const currentPeriod = getFormattedValueWrapper(`${effectiveComparisonId}_current_period`);
				const previousPeriod = getFormattedValueWrapper(`${effectiveComparisonId}_previous_period`);

				// Use date ranges as labels if available
				if (currentPeriod !== 'N/A') {
					currentLabel = currentPeriod;
				}
				if (previousPeriod !== 'N/A') {
					periodLabel = previousPeriod;
				}
			}
		}

		const rows: { label: string; value: string }[] = [
			{ label: currentLabel, value: currentValue },
			{ label: periodLabel, value: comparisonValue },
			{ label: 'separator', value: '' }, // Special separator row
			{ label: 'Change', value: changeAbs }
		];

		if (!hidePct) {
			rows.push({ label: 'Change %', value: changePct });
		}

		return {
			title: `${comparisonType === 'prior year' ? 'Prior Year' : 'Prior Period'} Comparison`,
			rows
		};
	} else if (comparisonType === 'benchmark') {
		const columns = constructTemporalColumns(resultField || '', comparisonId);

		const currentValue = getFormattedValueWrapper(columns.current);
		const benchmarkValue = getFormattedValueWrapper(columns.value);
		const changeAbs = getFormattedValueWrapper(columns.abs);
		const changePct = getFormattedValueWrapper(columns.pct);

		const rows: { label: string; value: string }[] = [
			{ label: 'Value', value: currentValue },
			{ label: 'Benchmark', value: benchmarkValue },
			{ label: 'separator', value: '' }, // Special separator row
			{ label: 'Difference', value: changeAbs }
		];

		if (!hidePct) {
			rows.push({ label: 'Difference %', value: changePct });
		}

		return {
			title: 'Benchmark Comparison',
			rows
		};
	}

	return { title: 'Comparison', rows: [] };
}
