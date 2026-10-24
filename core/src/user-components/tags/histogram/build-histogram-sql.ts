import { defaultDialect, type SqlDialect } from '../../../sql-dialect';

export interface HistogramSQLAttrs {
	data: string;
	value: string;
	series?: string;
	where?: string;
	/** Pre-resolved filter SQL (from filterIds). Combined with `where` at build time. */
	filterSql?: string;
	bin_count?: number;
	bin_width?: number;
	limit?: number;
	dialect?: SqlDialect;
}

function combineWhere(where: string | undefined, filterSql: string | undefined): string {
	if (where && filterSql) return `WHERE (${where}) AND (${filterSql})`;
	if (where) return `WHERE ${where}`;
	if (filterSql) return `WHERE ${filterSql}`;
	return '';
}

export function buildHistogramSQL(attrs: HistogramSQLAttrs): string {
	const { data, value, series, where, filterSql, bin_count, bin_width, limit } = attrs;
	const dialect = attrs.dialect ?? defaultDialect;
	const q = (name: string) => dialect.quoteAlias(name);
	// T-SQL only has CEILING; every other dialect accepts ceil.
	const ceil = dialect.nonAggregationFunctions.has('CEIL') ? 'ceil' : 'CEILING';

	const whereClause = combineWhere(where, filterSql);

	// bin_width as a portable expression. ClickHouse allowed forward-referencing
	// scalar bindings inside a WITH block; Snowflake requires real CTEs and has
	// no scalar-CTE form, so we resolve bin_count/bin_width inline against the
	// `stats` CTE columns.
	// An integer value column would otherwise bin with truncating division on
	// Postgres-family engines (width 0 → division by zero when range < bin_count).
	const toFloat = dialect.integerDivisionTruncates ? ' * 1.0' : '';
	const range = `(stats.${q('max_val')} - stats.${q('min_val')})${toFloat}`;
	let binWidthExpr: string;
	if (bin_width !== undefined && bin_width > 0) {
		binWidthExpr = `${bin_width}`;
	} else if (bin_count !== undefined && bin_count > 0) {
		binWidthExpr = `(${range} / ${bin_count})`;
	} else {
		binWidthExpr = `(${range} / stats.${q('rice_bin_count')})`;
	}

	const seriesSelect = series ? `, ${series}` : '';
	const seriesGroup = series ? `, ${series}` : '';
	const seriesOrder = series ? `, ${series}` : '';

	const statsSql = `
				SELECT
					min(${value}) AS ${q('min_val')},
					max(${value}) AS ${q('max_val')},
					${ceil}(2 * power(count(*), 1.0 / 3)) AS ${q('rice_bin_count')}
				FROM ${data}
				${whereClause}`;
	const binnedSql = (stats: string) => `
				SELECT
					floor((${value} - stats.${q('min_val')})${toFloat} / ${binWidthExpr}) AS ${q('bin_index')},
					stats.${q('min_val')} AS ${q('min_val')},
					${binWidthExpr} AS ${q('bin_width')}${seriesSelect}
				FROM ${data}
				CROSS JOIN ${stats}
				${whereClause}`;

	// Redshift rejects a WITH inside a CTE body, and `data` may be an inline query
	// the author wrote with CTEs — nest derived tables instead on such dialects.
	const fromBinned =
		dialect.supportsNestedCte === false
			? `FROM (${binnedSql(`(${statsSql}\n\t\t\t\t) AS stats`)}\n\t\t\t) AS binned`
			: `FROM binned`;
	const withClause =
		dialect.supportsNestedCte === false
			? ''
			: `WITH stats AS (${statsSql}\n\t\t\t),\n\t\t\tbinned AS (${binnedSql('stats')}\n\t\t\t)`;

	return `
			${withClause}
			SELECT
				${q('bin_index')},
				${q('min_val')} + ${q('bin_index')} * ${q('bin_width')} AS ${q('bin_start')},
				${q('min_val')} + (${q('bin_index')} + 1) * ${q('bin_width')} AS ${q('bin_end')},
				${series ? `${series},` : ''}
				count(*) AS ${q('frequency')}
			${fromBinned}
			GROUP BY
				${q('bin_index')},
				${q('min_val')},
				${q('bin_width')}${seriesGroup}
			ORDER BY
				${q('bin_index')}${seriesOrder}
			${limit ? `LIMIT ${limit}` : ''}
		`;
}
