import { escapeSqlValue, type SqlDialect } from '../../../sql-dialect';

export interface DimensionGridQueryAttrs {
	/** Fully-qualified table expression (e.g. `demo.orders` or a CTE name). */
	tableExpression: string;
	dimension: string;
	metric: string;
	limit: number;
	/** Pre-built WHERE fragment (no leading "WHERE"). Can combine user WHERE, date_range, filterIds. */
	baseWhereClause?: string;
	/** Cross-filter fragment from OTHER dimensions' selections. */
	crossFilterClause?: string;
	/** Selected values to force-include even if outside the top-N. */
	selectedValues?: string[];
	dialect?: SqlDialect;
}

export function buildDimensionGridQuery(attrs: DimensionGridQueryAttrs): string {
	const { tableExpression, dimension, metric, limit } = attrs;
	const selectedValues = attrs.selectedValues ?? [];

	let whereClause = `${dimension} IS NOT NULL`;
	if (attrs.baseWhereClause) whereClause += ` AND ${attrs.baseWhereClause}`;
	if (attrs.crossFilterClause) whereClause += ` AND ${attrs.crossFilterClause}`;

	const escapedSelectedValues = selectedValues
		.map((v) => `'${escapeSqlValue(String(v), attrs.dialect)}'`)
		.join(', ');

	// A count(*) metric would otherwise divide to 0 or 1 on Postgres-family engines.
	const toFloat = attrs.dialect?.integerDivisionTruncates ? ' * 1.0' : '';
	const ranked = `
	SELECT
		${dimension} AS "dimension_value",
		${metric} AS "metric_value",
		${metric}${toFloat} / nullIf(max(${metric}) OVER (), 0) AS "percent_of_top",
		row_number() OVER (ORDER BY ${metric} DESC) AS "rn"
	FROM ${tableExpression}
	WHERE ${whereClause}
	GROUP BY ${dimension}
`;

	// Redshift rejects a WITH inside a CTE body, and `tableExpression` may be an
	// inline query the author wrote with CTEs. Read the ranked rows from a derived
	// table; the two UNION ALL branches are disjoint on "rn", so OR them instead.
	if (attrs.dialect?.supportsNestedCte === false) {
		const keepSelected =
			selectedValues.length > 0
				? `
	OR ("dimension_value" IN (${escapedSelectedValues}) AND "rn" > ${limit})`
				: '';
		return `
SELECT "dimension_value", "metric_value", "percent_of_top"
FROM (${ranked}) AS ranked
WHERE "rn" <= ${limit}${keepSelected}
ORDER BY "metric_value" DESC
		`.trim();
	}

	return `
WITH ranked AS (${ranked})
SELECT "dimension_value", "metric_value", "percent_of_top"
FROM ranked
WHERE "rn" <= ${limit}${
		selectedValues.length > 0
			? `
UNION ALL
SELECT "dimension_value", "metric_value", "percent_of_top"
FROM ranked
WHERE "dimension_value" IN (${escapedSelectedValues})
	AND "rn" > ${limit}`
			: ''
	}
ORDER BY "metric_value" DESC
		`.trim();
}
