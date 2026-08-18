export type PivotResultSizeLowerBoundQueryResultRow = {
	exceeds_lower_bound: 0 | 1;
	exceeds_column_limit: 0 | 1;
	estimated_columns: number;
};

export const buildPivotResultSizeLowerBoundQuery = (
	dimensions: string[],
	pivots: string[],
	table: string,
	lowerBound: number,
	whereClause?: string,
	columnLimit?: number,
	measuresCount?: number,
	userLimit?: number
): string => {
	if (!dimensions.length && !pivots.length) return `SELECT 1`;

	const effectiveLimit = userLimit && userLimit < lowerBound ? userLimit : lowerBound;
	const measures = measuresCount || 1;
	const whereSQL = whereClause ? `\n\t\t${whereClause}` : '';

	const allColumns = [...dimensions, ...pivots];
	const ctes: string[] = [];

	// CTE 1: detail_combos — counts actual dimension × pivot combinations
	ctes.push(
		`\tdetail_combos AS (\n\t\tSELECT DISTINCT ${allColumns.join(', ')}\n\t\tFROM ${table}${whereSQL}\n\t\tLIMIT ${effectiveLimit + 1}\n\t)`
	);

	// CTE 2: pivot_combos — counts actual pivot value combinations (only when both dims and pivots exist)
	const hasPivotCombos = dimensions.length > 0 && pivots.length > 0;
	if (hasPivotCombos) {
		const pivotLimit = columnLimit ? columnLimit + 1 : effectiveLimit + 1;
		ctes.push(
			`\tpivot_combos AS (\n\t\tSELECT DISTINCT ${pivots.join(', ')}\n\t\tFROM ${table}${whereSQL}\n\t\tLIMIT ${pivotLimit}\n\t)`
		);
	}

	// Row check: actual combo count vs lower bound
	const exceedsLowerBound = `(SELECT COUNT(*) FROM detail_combos) > ${lowerBound} AS exceeds_lower_bound`;

	// Column check: dimensions + pivot_combos × measures vs column limit
	let columnEstimate: string;
	if (pivots.length > 0) {
		const pivotCountSource = hasPivotCombos ? 'pivot_combos' : 'detail_combos';
		columnEstimate = `${dimensions.length} + (SELECT COUNT(*) FROM ${pivotCountSource}) * ${measures}`;
	} else {
		columnEstimate = `${dimensions.length} + ${measures}`;
	}

	const exceedsColumnLimit = columnLimit
		? `${columnEstimate} > ${columnLimit} AS exceeds_column_limit`
		: '0 AS exceeds_column_limit';

	return `WITH\n${ctes.join(',\n')}\nSELECT\n\t${exceedsLowerBound},\n\t${exceedsColumnLimit},\n\t${columnEstimate} AS estimated_columns`;
};
