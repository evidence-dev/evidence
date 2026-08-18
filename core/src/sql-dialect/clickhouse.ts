import {
	COMMON_AGGREGATION_FUNCTIONS,
	COMMON_FUNCTION_TYPE_RULES,
	COMMON_NON_AGG_FUNCTIONS,
	NUMERIC_RULE,
	isSimpleIdentifier,
	wrapWithLimit,
	escapeBackslashStringLiteral,
	type DialectFunctionTypeRule,
	type SqlDialect
} from './common';

export class ClickHouseDialect implements SqlDialect {
	readonly name = 'clickhouse';

	dateGrain(grain: string, column: string, firstDayOfWeek: 'sunday' | 'monday'): string {
		const weekMode = firstDayOfWeek === 'sunday' ? 0 : 5;
		const dayOfWeekMode = firstDayOfWeek === 'sunday' ? 3 : 0;

		switch (grain) {
			case 'day':
				return `toStartOfDay(${column})`;
			case 'week':
				return `toStartOfWeek(${column}, ${weekMode})`;
			case 'month':
				return `toStartOfMonth(${column})`;
			case 'quarter':
				return `toStartOfQuarter(${column})`;
			case 'year':
				return `toStartOfYear(${column})`;
			case 'hour':
				return `toStartOfHour(${column})`;
			case 'day of week':
				return `toDayOfWeek(${column}, ${dayOfWeekMode})`;
			case 'day of month':
				return `toDayOfMonth(${column})`;
			case 'day of year':
				return `toDayOfYear(${column})`;
			case 'week of year':
				return `toWeek(${column}, ${weekMode})`;
			case 'month of year':
				return `toMonth(${column})`;
			case 'quarter of year':
				return `toQuarter(${column})`;
			default:
				return column;
		}
	}

	dateAdd(unit: string, amount: number | string, column: string): string {
		return `date_add(${unit}, ${amount}, ${column})`;
	}

	dateSub(unit: string, amount: number | string, column: string): string {
		return `date_sub(${unit}, ${amount}, ${column})`;
	}

	shortDateLabel(column: string): string {
		return `formatDateTime(${column}, '%b %e/%y')`;
	}

	dateLiteral(isoDate: string): string {
		return `toDate('${isoDate}')`;
	}

	castToString(column: string): string {
		return `CAST(${column} AS Nullable(String))`;
	}

	countDistinct(column: string): string {
		return `uniq(${column})`;
	}

	limitOffset(limit: number, offset?: number): string {
		if (offset !== undefined && offset !== 0) {
			return `LIMIT ${limit} OFFSET ${offset}`;
		}
		return `LIMIT ${limit}`;
	}

	applyRowLimit(sql: string, limit: number): string {
		return wrapWithLimit(sql, limit);
	}

	rowLimitClause({
		limit,
		offset
	}: {
		limit?: number;
		offset?: number;
		hasOrderBy: boolean;
	}): string {
		const parts: string[] = [];
		if (limit !== undefined) parts.push(`LIMIT ${limit}`);
		if (offset !== undefined) parts.push(`OFFSET ${offset}`);
		return parts.join(' ');
	}

	groupByAll(_groupingExpressions: string[]): string {
		return 'GROUP BY ALL';
	}

	anyValue(expr: string): string {
		return `any(${expr})`;
	}

	groupArray(sortKey: string, valueKey: string): string {
		return `arraySort(x -> x.1, groupArray((${sortKey}, ${valueKey})))`;
	}

	formatAlias(alias: string): string {
		return alias;
	}

	quoteAlias(alias: string): string {
		return `"${alias.replace(/"/g, '""')}"`;
	}

	readonly escapesBackslashInIdentifiers = true;

	quoteIdentifierIfNeeded(identifier: string): string {
		return isSimpleIdentifier(identifier) ? identifier : this.quoteAlias(identifier);
	}

	escapeStringLiteral(value: string): string {
		return escapeBackslashStringLiteral(value);
	}

	nullSafeEqual(a: string, b: string): string {
		return `${a} <=> ${b}`;
	}

	caseInsensitiveLike(column: string, pattern: string): string {
		return `${column} ILIKE '${pattern}'`;
	}

	iff(cond: string, a: string, b: string): string {
		return `if(${cond}, ${a}, ${b})`;
	}

	concat(parts: string[]): string {
		return parts.join(' || ');
	}

	readonly caseInsensitiveIdentifiers = false;
	readonly supportsFilterClause = true;
	readonly strictDerivedTables = false;

	readonly conditionalAggregateFunctions: ReadonlySet<string> = new Set<string>([
		'SUMIF',
		'AVGIF',
		'MINIF',
		'MAXIF',
		'COUNTIF',
		'ANYIF'
	]);

	readonly aggregationFunctions = new Set<string>([
		...COMMON_AGGREGATION_FUNCTIONS,
		// ClickHouse-specific aggregations
		'QUANTILE',
		'QUANTILES',
		'QUANTILETDIGEST',
		'SKEWSAMP',
		'ANY',
		'ALL',
		'SUMIF',
		'AVGIF',
		'MINIF',
		'MAXIF',
		'COUNTIF',
		'ANYIF',
		'UNIQ',
		'UNIQEXACT',
		'GROUPARRAY',
		// argMax/argMin ("value of col A at the max/min of col B") are the
		// idiomatic ClickHouse way to get e.g. "the latest year's value" as an
		// aggregate — omitting them made the aggregation validator false-flag
		// perfectly valid big_value expressions.
		'ARGMAX',
		'ARGMIN',
		'ANYLAST',
		'TOPK'
	]);

	readonly nonAggregationFunctions = new Set<string>([
		...COMMON_NON_AGG_FUNCTIONS,
		// ClickHouse-flavoured date/time functions (lowercase at the wire, uppercase for lookup)
		'TOYEAR',
		'TOQUARTER',
		'TOMONTH',
		'TOWEEK',
		'TODAYOFMONTH',
		'TODAYOFWEEK',
		'TOHOUR',
		'TOMINUTE',
		'TOSECOND',
		'TOSTARTOFDAY',
		'TOSTARTOFWEEK',
		'TOSTARTOFMONTH',
		'TOSTARTOFQUARTER',
		'TOSTARTOFYEAR',
		'TOSTARTOFHOUR',
		'TOISOWEEK',
		'TOYYYYMM',
		'TOYYYYMMDD',
		'TOYYYYMMDDHHMMSS',
		'FORMATDATETIME',
		'PARSEDATETIMEBESTEFFORT',
		'PARSEDATETIMEBESTEFFORTORNULL',
		'PARSEDATETIME64BESTEFFORT',
		'TODAY',
		'YESTERDAY',
		'NOW64',
		'CHANGEMONTH',
		// Array functions (ClickHouse)
		'ARRAYMAP',
		'ARRAYFILTER',
		'ARRAYDISTINCT',
		'ARRAYAVG',
		'ARRAYSUM',
		'LAGINFRAME'
	]);

	readonly functionTypeRules: Readonly<Record<string, ReadonlySet<DialectFunctionTypeRule>>> = {
		...COMMON_FUNCTION_TYPE_RULES,
		QUANTILETDIGEST: new Set(NUMERIC_RULE),
		SKEWSAMP: new Set(NUMERIC_RULE)
	};
}
