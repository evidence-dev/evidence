import { COMMON_FUNCTION_TYPE_RULES, NUMERIC_RULE, type DialectFunctionTypeRule } from './common';
import { FabricDialect } from './fabric';

// Days since the start of the week, independent of the session's SET DATEFIRST.
// (DATEPART(weekday, …) + @@DATEFIRST - 1) % 7 is 0 on Sunday regardless of DATEFIRST.
const daysSinceSunday = (column: string) =>
	`((DATEPART(weekday, ${column}) + @@DATEFIRST - 1) % 7)`;
const daysSinceMonday = (column: string) =>
	`((DATEPART(weekday, ${column}) + @@DATEFIRST - 2) % 7)`;

/**
 * SQL Server / Azure SQL dialect. Shares Fabric's T-SQL surface (TOP / OFFSET-FETCH
 * row limiting, no GROUP BY ALL, IIF, STRING_AGG sparklines) but targets SQL Server
 * 2017+, so it cannot use 2022-only DATETRUNC / GREATEST / LEAST or 2019's
 * APPROX_COUNT_DISTINCT. Date grains are built from DATEFROMPARTS / DATEADD instead.
 */
export class SqlServerDialect extends FabricDialect {
	readonly name: string = 'sqlserver';

	dateGrain(grain: string, column: string, firstDayOfWeek: 'sunday' | 'monday'): string {
		switch (grain) {
			case 'day':
				return `CAST(${column} AS DATE)`;
			case 'week': {
				// Unlike Fabric, the arithmetic is DATEFIRST-independent, so the
				// requested week start can be honored per call.
				const offset =
					firstDayOfWeek === 'monday' ? daysSinceMonday(column) : daysSinceSunday(column);
				return `DATEADD(day, -${offset}, CAST(${column} AS DATE))`;
			}
			case 'month':
				return `DATEFROMPARTS(YEAR(${column}), MONTH(${column}), 1)`;
			case 'quarter':
				return `DATEFROMPARTS(YEAR(${column}), (DATEPART(quarter, ${column}) - 1) * 3 + 1, 1)`;
			case 'year':
				return `DATEFROMPARTS(YEAR(${column}), 1, 1)`;
			case 'hour':
				return `DATEADD(hour, DATEDIFF(hour, 0, ${column}), 0)`;
			case 'day of week': {
				// 1 = the first day of the week, matching ClickHouse's toDayOfWeek modes.
				const offset =
					firstDayOfWeek === 'monday' ? daysSinceMonday(column) : daysSinceSunday(column);
				return `(${offset} + 1)`;
			}
			default:
				return super.dateGrain(grain, column, firstDayOfWeek);
		}
	}

	groupArray(sortKey: string, valueKey: string): string {
		// Same JSON-string shape as Fabric, but legacy DATETIME / SMALLDATETIME CAST to
		// 'Jan  1 2026 12:00AM'; style 126 renders every date type as ISO 8601.
		const tuple = `CONCAT('["', CONVERT(VARCHAR(MAX), ${sortKey}, 126), '",', ISNULL(CAST(${valueKey} AS VARCHAR(MAX)), 'null'), ']')`;
		return `CONCAT('[', STRING_AGG(${tuple}, ',') WITHIN GROUP (ORDER BY ${sortKey}), ']')`;
	}

	readonly aggregationFunctions = new Set<string>([
		'COUNT',
		'COUNT_BIG',
		'SUM',
		'AVG',
		'MIN',
		'MAX',
		'STRING_AGG',
		'STDEV',
		'STDEVP',
		'VAR',
		'VARP',
		'CHECKSUM_AGG',
		'GROUPING'
	]);

	readonly nonAggregationFunctions = new Set<string>([
		// Conditional / null handling
		'CASE',
		'IIF',
		'CHOOSE',
		'NULLIF',
		'COALESCE',
		'ISNULL',
		// Type / string
		'CAST',
		'CONVERT',
		'TRY_CAST',
		'TRY_CONVERT',
		'CONCAT',
		'CONCAT_WS',
		'SUBSTRING',
		'TRIM',
		'LTRIM',
		'RTRIM',
		'UPPER',
		'LOWER',
		'REPLACE',
		'LEFT',
		'RIGHT',
		'LEN',
		'CHARINDEX',
		'PATINDEX',
		'STUFF',
		'STR',
		'FORMAT',
		'STRING_SPLIT',
		// Numeric
		'ROUND',
		'FLOOR',
		'CEILING',
		'ABS',
		'SQRT',
		'POWER',
		'SIGN',
		'LOG',
		'LOG10',
		'EXP',
		// Date
		'DATEADD',
		'DATEDIFF',
		'DATEDIFF_BIG',
		'DATEPART',
		'DATENAME',
		'DATEFROMPARTS',
		'DATETIMEFROMPARTS',
		'DATETIME2FROMPARTS',
		'EOMONTH',
		'GETDATE',
		'GETUTCDATE',
		'SYSDATETIME',
		'CURRENT_TIMESTAMP',
		// Time-unit literals / date-part functions
		'YEAR',
		'QUARTER',
		'MONTH',
		'WEEK',
		'DAY',
		'HOUR',
		'MINUTE',
		'SECOND',
		// JSON
		'JSON_VALUE',
		'JSON_QUERY',
		'ISJSON'
	]);

	readonly functionTypeRules: Readonly<Record<string, ReadonlySet<DialectFunctionTypeRule>>> = {
		SUM: COMMON_FUNCTION_TYPE_RULES.SUM,
		AVG: COMMON_FUNCTION_TYPE_RULES.AVG,
		MIN: COMMON_FUNCTION_TYPE_RULES.MIN,
		MAX: COMMON_FUNCTION_TYPE_RULES.MAX,
		COUNT: COMMON_FUNCTION_TYPE_RULES.COUNT,
		STDEV: new Set(NUMERIC_RULE),
		STDEVP: new Set(NUMERIC_RULE),
		VAR: new Set(NUMERIC_RULE),
		VARP: new Set(NUMERIC_RULE)
	};
}
