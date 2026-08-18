import {
	generateSQLQuery,
	type BaseSQLAttrs,
	type SQLQueryConfig,
	type SQLQueryResult
} from '../../common/sql-options';
import {
	processColumnExpression,
	type ProcessedColumnExpression
} from '../../common/sql-expression-utils';
import type { DateGrain } from '../../common/date-options';
import type { SqlDialect } from '../../../sql-dialect';
import { defaultDialect } from '../../../sql-dialect';
import { dedupeTooltipColumns } from '../../common/tooltip-fields';

export interface CandlestickSQLAttrs extends BaseSQLAttrs {
	x: string;
	open: string;
	high: string;
	low: string;
	close: string;
	volume?: string;
	date_grain?: DateGrain | string;
	dialect?: SqlDialect;
	tooltipFieldColumns?: readonly ProcessedColumnExpression[];
}

export function buildCandlestickSQLConfig(attrs: CandlestickSQLAttrs): SQLQueryConfig {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;

	const xProcessed = processColumnExpression(
		{
			value: attrs.x,
			dateGrain: attrs.date_grain,
			firstDayOfWeek
		},
		dialect
	);
	// TODO: BUG - with date_grain on raw daily OHLC data, GROUP BY ALL keys on every OHLC column, producing many rows per period instead of one candlestick. OHLC should aggregate ordered by x: first(open) and last(close) by time, max(high), min(low).
	const openProcessed = processColumnExpression({ value: attrs.open }, dialect);
	const highProcessed = processColumnExpression({ value: attrs.high }, dialect);
	const lowProcessed = processColumnExpression({ value: attrs.low }, dialect);
	const closeProcessed = processColumnExpression({ value: attrs.close }, dialect);
	const volumeProcessed = attrs.volume
		? processColumnExpression({ value: attrs.volume }, dialect)
		: null;

	const primaryColumns: ProcessedColumnExpression[] = [
		xProcessed,
		openProcessed,
		highProcessed,
		lowProcessed,
		closeProcessed
	];
	if (volumeProcessed) primaryColumns.push(volumeProcessed);

	const columns = [
		...primaryColumns,
		...dedupeTooltipColumns(primaryColumns, attrs.tooltipFieldColumns)
	];

	const order = attrs.order ? attrs.order : xProcessed.alias;

	return {
		tableExpressionName: attrs.data,
		columns,
		filterIds: attrs.filters ?? [],
		where: attrs.where,
		having: attrs.having,
		qualify: attrs.qualify,
		order,
		limit: attrs.limit,
		date_range: attrs.date_range
	};
}

export function buildCandlestickSQL(attrs: CandlestickSQLAttrs): SQLQueryResult {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;
	return generateSQLQuery(
		buildCandlestickSQLConfig(attrs),
		undefined,
		undefined,
		attrs.anchorDate,
		firstDayOfWeek,
		dialect
	);
}
