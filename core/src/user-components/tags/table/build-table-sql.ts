import {
	generateSQLQuery,
	generateGroupingSets,
	generateSubtotalHelperColumns,
	type BaseSQLAttrs,
	type SQLQueryConfig,
	type SQLQueryResult
} from '../../common/sql-options';
import type { ProcessedColumnExpression } from '../../common/sql-expression-utils';
import type { UnifiedColumnDefinition } from './unified-column-definition.types';
import { generateTableComparisonQueryConfig, getMostGranularDateGrain } from './table-comparisons';
import type { SqlDialect } from '../../../sql-dialect';
import { defaultDialect } from '../../../sql-dialect';

export interface TableSQLAttrs extends BaseSQLAttrs {
	/**
	 * Pre-expanded column list. In runtime the TableModel computes this from
	 * array-form props + child DimensionModel/MeasureModel/PivotModel outputs;
	 * tests construct it directly using processColumnExpression.
	 */
	unifiedColumns: UnifiedColumnDefinition[];
	page_size?: number;
	offset?: number;
	subtotals?: boolean;
	search?: { term?: string; columns?: string[] };
	dialect?: SqlDialect;
	/** Set when `data` is a wrapper subquery this model built, not a table name. */
	dataIsSql?: boolean;
}

export function buildTableSQLConfig(attrs: TableSQLAttrs): SQLQueryConfig {
	const dialect = attrs.dialect ?? defaultDialect;
	const comparisonQueryConfigs = generateTableComparisonQueryConfig(
		attrs.unifiedColumns,
		attrs.date_range
	);

	const sparklineQueryConfigs = attrs.unifiedColumns
		.filter(
			(col) =>
				col.type === 'measure' &&
				col.viz === 'sparkline' &&
				col.sparklineVizConfig &&
				col.sparklineVizConfig.x
		)
		.map((col) => {
			const config = col.sparklineVizConfig!;
			return {
				id: config.id,
				xColumn: config.x!,
				yColumn: config.y,
				type: config.type,
				date_range: config.date_range,
				date_grain: config.date_grain
			};
		});

	// Mirror TableModel.processedColumnsForQuery: drop sparkline measures (they
	// feed from fragments), promote non-agg measures to dimension-typed columns,
	// and switch complex dim/pivot exprs to their alias when subtotals are on.
	const processedColumns: ProcessedColumnExpression[] = attrs.unifiedColumns
		.filter((col) => !(col.type === 'measure' && col.viz === 'sparkline'))
		.map((col) => {
			let expr = col.processedColumnExpression;
			if (!expr) return null;

			if (col.type === 'measure' && !expr.hasAgg) {
				expr = { ...expr, type: 'dimension' } as ProcessedColumnExpression;
			}

			if (
				attrs.subtotals &&
				expr.isComplexExpression &&
				(expr.type === 'dimension' || expr.type === 'pivot')
			) {
				return { ...expr, sqlWithAlias: expr.alias, sqlWithoutAlias: expr.alias };
			}

			return expr;
		})
		.filter((expr): expr is ProcessedColumnExpression => !!expr);

	const hasDimensions = attrs.unifiedColumns.some((c) => c.type === 'dimension');
	const hasPivots = attrs.unifiedColumns.some((c) => c.type === 'pivot');
	const hasMeasures = attrs.unifiedColumns.some(
		(c) => c.type === 'measure' && c.processedColumnExpression?.hasAgg
	);
	const hasVisibleMeasures = attrs.unifiedColumns.some(
		(c) => c.type === 'measure' && c.processedColumnExpression?.hasAgg && !c.hide
	);

	const needsSubtotals = Boolean(
		attrs.subtotals && (hasDimensions || hasPivots) && hasVisibleMeasures && !attrs.limit
	);

	const dateDimensionsWithGrain = attrs.unifiedColumns
		.filter(
			(col) =>
				(col.type === 'dimension' || col.type === 'pivot') &&
				col.date_grain &&
				col.isTemporalDateGrain
		)
		.map((col) => ({
			expression: col.processedColumnExpression?.sqlWithoutAlias ?? '',
			grain: col.date_grain!
		}));
	const mostGranular =
		dateDimensionsWithGrain.length > 0
			? (dateDimensionsWithGrain.find(
					(d) => d.grain === getMostGranularDateGrain(dateDimensionsWithGrain.map((g) => g.grain))
				) ?? dateDimensionsWithGrain[0])
			: null;

	const searchActive = Boolean(
		attrs.search?.term?.trim() && (attrs.search?.columns?.length ?? 0) > 0
	);

	return {
		tableExpressionName: attrs.data,
		tableExpressionIsSql: attrs.dataIsSql,
		columns: processedColumns,
		filterIds: attrs.filters,
		where: attrs.where,
		date_range: attrs.date_range,
		having: attrs.having,
		qualify: attrs.qualify,
		order: attrs.order,
		limit: attrs.limit,
		page_size: attrs.page_size,
		offset: attrs.offset,
		subtotals: needsSubtotals,
		search: searchActive
			? { term: attrs.search!.term!.trim(), columns: attrs.search!.columns }
			: undefined,
		comparisons: comparisonQueryConfigs.length > 0 ? comparisonQueryConfigs : undefined,
		sparklines: sparklineQueryConfigs.length > 0 ? sparklineQueryConfigs : undefined,
		hasDimensions,
		hasPivots,
		hasMeasures,
		groupingSets: needsSubtotals ? generateGroupingSets(processedColumns) : undefined,
		subtotalHelperColumns: needsSubtotals
			? generateSubtotalHelperColumns(processedColumns, dialect)
			: undefined,
		dateDimensionExpression: mostGranular?.expression,
		dateDimensionGrain: mostGranular?.grain
	};
}

export function buildTableSQL(attrs: TableSQLAttrs): SQLQueryResult {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;
	const config = buildTableSQLConfig(attrs);
	return generateSQLQuery(config, undefined, undefined, attrs.anchorDate, firstDayOfWeek, dialect);
}
