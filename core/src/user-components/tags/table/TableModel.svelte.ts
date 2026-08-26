import { Query, type SerializedQuery } from '../../../Query.svelte';
import { type UserComponentProps } from '../../types';
import type { schema } from './schema';
import type { UnifiedColumnDefinition } from './unified-column-definition.types';
import {
	processColumnExpression,
	type ProcessedColumnExpression
} from '../../common/sql-expression-utils';
import {
	quoteUntrustedIdentifierPath,
	resolveTableExpressionName,
	type SQLQueryConfig
} from '../../common/sql-options';
import { getMostGranularDateGrain } from './table-comparisons';
import { buildTableSQLConfig } from './build-table-sql';
import { DimensionModel } from './dimension/DimensionModel.svelte';
import { processDateRange } from '../../common/date-options';
import { parseDateStringAsLocalMidnight } from '../../../utils/date-utils';
import { MeasureModel } from './measure/MeasureModel.svelte';
import {
	UserComponentModel,
	type WithDefaults,
	type UserComponentModelInit
} from '../../UserComponentModel';
import { PivotModel } from './pivot/PivotModel.svelte';
import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
import { logger } from '../../../shims/logger';

type TableAttributes = UserComponentProps<typeof schema>;

type SerializedTableModel = {
	page: number;
	query: SerializedQuery;
};

type TableModelGenerics = WithDefaults<{
	Attributes: TableAttributes;
	Serialized: SerializedTableModel;
	ValidChildren: [typeof DimensionModel, typeof MeasureModel, typeof PivotModel];
}>;

export class TableModel extends UserComponentModel<TableModelGenerics> {
	readonly query: Query;

	page: number = $state(0);

	order: string | undefined = $state();

	pageSizeOverride: number | undefined = $state(undefined);

	searchTerm: string = $state('');

	/**
	 * Cached column names from the first successful query result.
	 * Used as the fallback for search columns on plain tables (no explicit dims/measures)
	 * to avoid a reactive cycle where searchColumns depends on query.result which
	 * depends on queryConfig which depends on searchColumns.
	 */
	private _cachedResultColumnNames: string[] = $state([]);

	constructor(init: UserComponentModelInit<TableModelGenerics>) {
		super(init, {
			validChildClasses: [DimensionModel, MeasureModel, PivotModel]
		});

		this.page = init.serialized?.page ?? 0;

		this.query = new Query(
			() => this.queryConfig,
			init.deps,
			{
				count: true,
				exceedRowLimitBehavior: 'paginate',
				refreshInterval: () => this.attributes.refresh_interval
			},
			init.serialized?.query
		);

		$effect(() => {
			const cols = this.query.result?.columns;
			if (cols && cols.length > 0) {
				this._cachedResultColumnNames = cols.map((col) => col.name);
			}
		});
	}

	// === VARIABLE INTERPOLATION ===
	// Handle reactive variable interpolation for display props
	readonly variableProcessor = $derived.by(() => {
		// Find the first valid filter context (some might be undefined)
		const filters = this.deps?.filterContexts?.find((ctx) => ctx !== undefined);
		const inlineQueries = this.deps?.inlineQueries;

		return filters && inlineQueries ? new VariableProcessor(filters, inlineQueries) : null;
	});

	// Resolve attributes with variable interpolation
	readonly resolvedData = $derived(this.resolveText(this.attributes.data));

	// A `{% measure metric="revenue" /%}` child implies its metric view's base
	// table. When the table has no explicit `data`, use that base so a metric-only
	// table needs no `data=`. (All metric measures must share one base — v1.)
	readonly metricBase: string | undefined = $derived.by(() => {
		for (const child of this.children) {
			if (child instanceof MeasureModel && child.metricBase) return child.metricBase;
		}
		return undefined;
	});
	readonly resolvedTitle = $derived(this.resolveText(this.attributes.title));
	readonly resolvedSubtitle = $derived(this.resolveText(this.attributes.subtitle));
	readonly resolvedInfo = $derived(this.resolveText(this.attributes.info));
	readonly resolvedInfo_link = $derived(this.resolveText(this.attributes.info_link));
	readonly resolvedInfo_link_title = $derived(this.resolveText(this.attributes.info_link_title));
	readonly resolvedTotalLabel = $derived(this.resolveText(this.attributes.total_label));
	readonly resolvedWhere = $derived(this.resolveSql(this.attributes.where));
	readonly resolvedHaving = $derived(this.resolveSql(this.attributes.having));
	readonly resolvedQualify = $derived(this.resolveSql(this.attributes.qualify));
	readonly resolvedOrder = $derived(this.resolveSql(this.attributes.order));

	readonly resolvedDateRange = $derived.by(() => {
		if (!this.attributes.date_range) return undefined;
		// Process entire date_range object - recursively handles all string properties
		return this.resolveText(this.attributes.date_range);
	});

	readonly resolvedRowConditionalColors = $derived(
		this.resolveColumn(this.attributes.row_conditional_colors)
	);

	readonly queryConfig: SQLQueryConfig | undefined = $derived.by(() => {
		if (this.hasBlockingError) return undefined;

		return buildTableSQLConfig({
			data: this.finalTableExpression,
			dataIsSql: this.tableExpressionIsSql,
			unifiedColumns: this.allUnifiedColumns,
			where: this.resolvedWhere,
			having: this.resolvedHaving,
			qualify: this.resolvedQualify,
			order: this.order ?? this.resolvedOrder,
			date_range: this.resolvedDateRange,
			filters: this.attributes.filters,
			limit: this.attributes.limit,
			page_size: this.pageSizeOverride ?? this.attributes.page_size,
			offset: this.serverSidePaginated
				? this.page * (this.pageSizeOverride ?? this.attributes.page_size)
				: undefined,
			subtotals: this.attributes.subtotals,
			search:
				this.attributes.search && this.searchTerm.trim() && this.searchColumns.length > 0
					? { term: this.searchTerm.trim(), columns: this.searchColumns }
					: undefined,
			dialect: this.deps.connection.dialect
		});
	});

	async init(): Promise<void> {
		await this.query.init();
	}

	toSerialized(): SerializedTableModel {
		return {
			page: this.page,
			query: this.query.toSerialized()
		};
	}

	readonly resolvedTableExpression: string = $derived.by(() => {
		// Use resolvedData (variable-interpolated), falling back to a metric
		// measure's base when the table has no explicit `data`.
		const dataValue = this.resolvedData || this.metricBase;
		if (!dataValue) return '';

		// Try to interpolate inline queries, but handle errors gracefully during editing.
		// A name that is not an inline query is quoted here, because the wrappers below
		// embed this in raw SQL that generateSQLQuery then passes through untouched.
		const dialect = this.deps.connection.dialect;
		try {
			return resolveTableExpressionName(dataValue, this.deps?.inlineQueries, dialect);
		} catch (error) {
			// During editing, user may temporarily have invalid syntax (e.g., unbalanced brackets)
			// Return the raw data attribute to avoid crashing the page
			logger.warn(error, 'Failed to interpolate inline query, using raw data attribute');
			return quoteUntrustedIdentifierPath(dataValue, dialect);
		}
	});

	// Pass the raw data name (not the pre-interpolated SQL) as the table expression
	// for queryConfig. This ensures generateSQLQuery calls getInterpolated() with
	// the raw name inside the Query's source getters, creating a direct reactive
	// dependency on filter values — matching how FunnelChart and other components work.
	// For subtotals with complex expressions, we wrap the raw name so that
	// generateSQLQuery resolves the inner name during query generation.
	readonly finalTableExpression: string = $derived.by(() => {
		// Fall back to a metric measure's base when the table has no explicit `data`.
		const dataValue = this.resolvedData || this.metricBase;
		if (!dataValue) return '';

		let base = dataValue;

		// Handle subtotals complex expressions (existing logic)
		if (this.attributes.subtotals) {
			const complexExpressions = this.allUnifiedColumns
				.filter(
					(col) => (col.type === 'dimension' || col.type === 'pivot') && col.isComplexExpression
				)
				.map((col) => col.sqlWithAlias);

			if (complexExpressions.length > 0) {
				// Wrap the resolved (interpolated) expression for subtotals — this case
				// requires the full SQL for the subquery wrapper
				base = `(SELECT *, ${complexExpressions.join(', ')} FROM ${this.resolvedTableExpression})`;
			}
		}

		// For self-closing tables (SELECT * mode), materialize row_conditional_colors
		// in a subquery so the outer SELECT * picks it up automatically.
		// Only works for non-aggregate expressions — self-closing tables have no
		// GROUP BY, so aggregate functions like sum() would produce a SQL error.
		const hasRowColorInColumns = this.allUnifiedColumns.some(
			(c) => c.alias === '__row_conditional_colors'
		);
		if (this.resolvedRowConditionalColors && !hasRowColorInColumns) {
			const resolvedBase = base === dataValue ? this.resolvedTableExpression : base;
			const processed = processColumnExpression(
				{
					value: this.resolvedRowConditionalColors,
					type: 'measure',
					firstDayOfWeek: this.projectSettings.first_day_of_week
				},
				this.deps.connection.dialect
			);
			if (!processed.hasAgg) {
				base = `(SELECT *, ${processed.sqlWithoutAlias} AS ${this.deps.connection.dialect.quoteAlias('__row_conditional_colors')} FROM ${resolvedBase})`;
			}
		}

		return base;
	});

	/** True once this model has resolved the name itself, so the shared guard must not redo it. */
	readonly tableExpressionIsSql: boolean = $derived(
		this.finalTableExpression !== this.resolvedData
	);

	readonly allUnifiedColumns: UnifiedColumnDefinition[] = $derived.by(() => {
		const columns: UnifiedColumnDefinition[] = [];

		const dimensionsProp = this.attributes.dimensions.filter(
			(x): x is string => typeof x === 'string'
		);
		const measuresProp = this.attributes.measures.filter((x): x is string => typeof x === 'string');
		const pivotsProp = this.attributes.pivots.filter((x): x is string => typeof x === 'string');

		// Add columns from props (dimensions, measures, pivots)
		if (dimensionsProp.length > 0) {
			dimensionsProp.forEach((dim) => {
				// Type guard: ensure we have a string
				if (typeof dim !== 'string') return;

				const processed = processColumnExpression(
					{
						value: dim,
						type: 'dimension',
						firstDayOfWeek: this.projectSettings.first_day_of_week
					},
					this.deps.connection.dialect
				);

				columns.push({
					type: 'dimension',
					processedColumnExpression: processed,
					sqlWithAlias: processed.sqlWithAlias,
					alias: processed.alias,
					columnIdForRendering: processed.alias, // For prop-based dimensions, always use alias
					sqlWithoutAlias: processed.sqlWithoutAlias,
					isComplexExpression: processed.isComplexExpression
				});
			});
		}

		if (measuresProp.length > 0) {
			measuresProp.forEach((measure) => {
				// Type guard: ensure we have a string
				if (typeof measure !== 'string') return;

				const processed = processColumnExpression(
					{
						value: measure,
						type: 'measure',
						firstDayOfWeek: this.projectSettings.first_day_of_week
					},
					this.deps.connection.dialect
				);

				columns.push({
					type: 'measure',
					processedColumnExpression: processed,
					sqlWithAlias: processed.sqlWithAlias,
					alias: processed.alias,
					columnIdForRendering: processed.alias, // For prop-based measures, always use alias
					sqlWithoutAlias: processed.sqlWithoutAlias,
					hasAgg: processed.hasAgg,
					align: 'right'
				});
			});
		}

		if (pivotsProp.length > 0) {
			pivotsProp.forEach((pivot) => {
				// Type guard: ensure we have a string
				if (typeof pivot !== 'string') return;
				const processed = processColumnExpression(
					{
						value: pivot,
						type: 'pivot',
						firstDayOfWeek: this.projectSettings.first_day_of_week
					},
					this.deps.connection.dialect
				);

				columns.push({
					type: 'pivot',
					processedColumnExpression: processed,
					sqlWithAlias: processed.sqlWithAlias,
					alias: processed.alias,
					columnIdForRendering: processed.alias, // For prop-based pivots, always use alias
					sqlWithoutAlias: processed.sqlWithoutAlias,
					isComplexExpression: processed.isComplexExpression
				});
			});
		}

		const childColumns = this.children
			.flatMap((child) => {
				if (child instanceof DimensionModel) return child.columns;
				else if (child instanceof MeasureModel) return child.columns;
				else if (child instanceof PivotModel) return child.column ? [child.column] : [];
				else return [];
			})
			.filter((x): x is Exclude<typeof x, undefined> => x !== undefined);

		// Add hidden dimensions needed for benchmark comparisons
		// Extract all unique benchmark groups + grain from all measures
		const benchmarkDimensionsNeeded = new Set<string>();
		for (const col of childColumns) {
			if (col.comparison && col.comparison.compare_vs === 'benchmark' && col.comparison.benchmark) {
				// Add benchmark within dimensions
				if (col.comparison.benchmark.within) {
					for (const dim of col.comparison.benchmark.within) {
						benchmarkDimensionsNeeded.add(dim);
					}
				}
				// Add benchmark subject
				if (col.comparison.benchmark.subject) {
					benchmarkDimensionsNeeded.add(col.comparison.benchmark.subject);
				}
			}
		}

		// Check which benchmark dimensions are not already in the table
		const existingDimensionAliases = new Set([
			...columns.map((col) => col.alias),
			...childColumns.map((col) => col.alias)
		]);

		for (const benchmarkDim of benchmarkDimensionsNeeded) {
			if (!existingDimensionAliases.has(benchmarkDim)) {
				// Add this dimension as a hidden MEASURE (not dimension) to avoid GROUPING SETS participation
				// Following the same pattern as image/link hidden columns
				const hiddenAlias = `__benchmark_${benchmarkDim}`;
				const { dialect } = this.deps.connection;

				columns.push({
					type: 'measure',
					processedColumnExpression: {
						sqlWithAlias: `${dialect.anyValue(benchmarkDim)} AS ${hiddenAlias}`,
						sqlWithoutAlias: dialect.anyValue(benchmarkDim),
						sqlWithoutDateFiltersOrAlias: dialect.anyValue(benchmarkDim),
						alias: hiddenAlias,
						displayAlias: hiddenAlias,
						type: 'measure',
						isComplexExpression: false,
						hasAgg: true,
						isTemporalDateGrain: false,
						hasDateGrain: false,
						hasDateRange: false,
						isTableComparison: false,
						isTableSparkline: false
					},
					sqlWithAlias: `${dialect.anyValue(benchmarkDim)} AS ${hiddenAlias}`,
					alias: hiddenAlias,
					columnIdForRendering: hiddenAlias,
					sqlWithoutAlias: dialect.anyValue(benchmarkDim),
					isComplexExpression: false,
					hide: true, // Hide from display
					align: 'left'
				});
			}
		}

		// Add hidden column for row_conditional_colors when there are explicit columns.
		// For self-closing tables (SELECT * mode), the expression is materialized
		// in finalTableExpression instead to avoid triggering the pivot path.
		const hasVisibleColumns = columns.some((c) => !c.hide) || childColumns.length > 0;
		if (this.resolvedRowConditionalColors && hasVisibleColumns) {
			const rowColorProcessed = processColumnExpression(
				{
					value: this.resolvedRowConditionalColors,
					type: 'measure',
					firstDayOfWeek: this.projectSettings.first_day_of_week
				},
				this.deps.connection.dialect
			);

			const sqlExpression = rowColorProcessed.hasAgg
				? `${rowColorProcessed.sqlWithoutAlias} AS __row_conditional_colors`
				: `${this.deps.connection.dialect.anyValue(rowColorProcessed.sqlWithoutAlias)} AS __row_conditional_colors`;

			const finalProcessed = processColumnExpression(
				{
					value: sqlExpression,
					type: 'measure',
					firstDayOfWeek: this.projectSettings.first_day_of_week
				},
				this.deps.connection.dialect
			);

			columns.push({
				type: 'measure',
				processedColumnExpression: finalProcessed,
				sqlWithAlias: finalProcessed.sqlWithAlias,
				alias: finalProcessed.alias,
				columnIdForRendering: finalProcessed.alias,
				sqlWithoutAlias: finalProcessed.sqlWithoutAlias,
				isComplexExpression: finalProcessed.isComplexExpression,
				hide: true,
				align: 'right'
			});
		}

		for (const definition of childColumns) {
			// Calculate most granular date grain from all columns collected so far
			const dateDimensionsWithGrain = columns
				.concat(childColumns) // Include both prop columns and child columns
				.filter(
					(col) =>
						(col.type === 'dimension' || col.type === 'pivot') &&
						col.date_grain &&
						col.isTemporalDateGrain
				)
				.map((col) => col.date_grain);

			const mostGranularGrain = getMostGranularDateGrain(dateDimensionsWithGrain);

			// Enhance comparison metadata if needed
			if (
				definition.comparison &&
				(definition.comparison.compare_vs === 'prior year' ||
					definition.comparison.compare_vs === 'prior period') &&
				!definition.comparison.dateGrain
			) {
				// Parse date range period info
				const effectiveDateRange = definition.comparison.date_range ?? this.resolvedDateRange;
				const anchorDate = this.projectSettings.computedDefaultDateRangeEnd
					? parseDateStringAsLocalMidnight(this.projectSettings.computedDefaultDateRangeEnd)
					: new Date();
				const processed = effectiveDateRange?.range
					? processDateRange(
							effectiveDateRange.range,
							undefined,
							anchorDate,
							this.projectSettings.first_day_of_week,
							this.deps.connection.dialect
						)
					: null;
				const parsedPeriod = processed
					? {
							type: processed.type,
							periodGrain: processed.periodGrain,
							periodCount: processed.periodCount,
							isToDate: processed.isToDate
						}
					: null;

				columns.push({
					...definition,
					comparison: {
						...definition.comparison,
						dateGrain: mostGranularGrain,
						// Add periodCount for proper title formatting (lightweight period parsing only)
						periodCount: mostGranularGrain ? 1 : (parsedPeriod?.periodCount ?? 1),
						rangePeriodCount: parsedPeriod?.periodCount ?? 1,
						rangePeriodGrain: parsedPeriod?.periodGrain
					}
				});
			} else {
				columns.push({
					...definition
				});
			}
		}

		return columns;
	});

	readonly dimensions: string[] = $derived.by(() => {
		// dimensions include non-aggregated measures
		return this.allUnifiedColumns
			.filter(
				(col) =>
					col.type === 'dimension' ||
					(col.type === 'measure' && !col.processedColumnExpression?.hasAgg)
			)
			.map((col) => col.columnIdForRendering);
	});

	readonly pivots: string[] = $derived.by(() => {
		return this.allUnifiedColumns
			.filter((col) => col.type === 'pivot')
			.map((col) => col.columnIdForRendering);
	});

	readonly measures: string[] = $derived.by(() => {
		return this.allUnifiedColumns
			.filter((col) => col.type === 'measure' && col.processedColumnExpression?.hasAgg)
			.map((col) => col.columnIdForRendering);
	});

	/**
	 * Hidden measures that should pass through pivoting without being duplicated
	 * per pivot value. These are dimension fragment columns (image, logo, link,
	 * conditional_colors) and row-level columns (__row_conditional_colors).
	 * First non-null value wins when multiple raw rows map to the same pivoted row.
	 */
	readonly passThroughMeasures: string[] = $derived.by(() => {
		const measureFragmentAliases = new Set<string>();
		for (const col of this.allUnifiedColumns) {
			if (col.type === 'measure' && col.fragmentColumnAliases) {
				for (const alias of col.fragmentColumnAliases) {
					measureFragmentAliases.add(alias);
				}
			}
		}
		return this.allUnifiedColumns
			.filter(
				(col) =>
					col.type === 'measure' &&
					col.hide &&
					!measureFragmentAliases.has(col.columnIdForRendering)
			)
			.map((col) => col.columnIdForRendering);
	});

	readonly visibleMeasureNames: string[] = $derived.by(() => {
		return this.allUnifiedColumns
			.filter((col) => col.type === 'measure' && col.processedColumnExpression?.hasAgg && !col.hide)
			.map((col) => col.columnIdForRendering);
	});

	readonly usePivotTableFunction: boolean = $derived.by(() => {
		return this.dimensions.length > 0 || this.pivots.length > 0 || this.measures.length > 0;
	});

	readonly serverSidePaginated: boolean = $derived.by(() => {
		// Non-pivot tables can use client-side pagination if they have < 2000 rows
		if (!this.usePivotTableFunction && !this.query.rowLimitExceeded) {
			return false;
		}
		// Otherwise: non-pivot tables → server-side, tables with children → based on pagination forced
		return !this.usePivotTableFunction || Boolean(this.query.paginationForced);
	});

	readonly needsSubtotals: boolean = $derived.by(() => {
		return (
			this.attributes.subtotals &&
			(this.dimensions.length > 0 || this.pivots.length > 0) &&
			this.visibleMeasureNames.length > 0 &&
			!this.attributes.limit // Disable subtotals when limit is provided
		);
	});

	readonly mostGranularDateDimensionInfo: { expression: string; grain: string } | null =
		$derived.by(() => {
			const dateDimensionsWithGrain = this.allUnifiedColumns
				.filter(
					(col) =>
						(col.type === 'dimension' || col.type === 'pivot') &&
						col.date_grain &&
						col.isTemporalDateGrain
				)
				.map((col) => ({
					expression: col.processedColumnExpression?.sqlWithoutAlias || '',
					grain: col.date_grain!
				}));

			if (dateDimensionsWithGrain.length === 0) {
				return null;
			}

			// Get the most granular grain
			const grains = dateDimensionsWithGrain.map((d) => d.grain);
			const mostGranularGrain = getMostGranularDateGrain(grains);

			// Find the dimension with the most granular grain
			const mostGranularDimension = dateDimensionsWithGrain.find(
				(d) => d.grain === mostGranularGrain
			);

			return mostGranularDimension || dateDimensionsWithGrain[0];
		});

	readonly processedColumnsForQuery: ProcessedColumnExpression[] = $derived.by(() => {
		return (
			this.allUnifiedColumns
				// Exclude sparkline measures – they get data from fragments
				.filter((col) => !(col.type === 'measure' && col.viz === 'sparkline'))
				.map((col) => {
					let expr = col.processedColumnExpression;
					if (!expr) return null;

					// Promote non-aggregated measures to behave like dimensions in SQL (prevents accidental
					// aggregation and feeds the pivot-size lower-bound check).
					if (col.type === 'measure' && !expr.hasAgg) {
						expr = { ...expr, type: 'dimension' } as ProcessedColumnExpression;
					}

					// Use alias for complex dimensions/pivots when subtotals are enabled – these are materialised in the tableExpression
					if (
						this.attributes.subtotals &&
						expr.isComplexExpression &&
						(expr.type === 'dimension' || expr.type === 'pivot')
					) {
						return { ...expr, sqlWithAlias: expr.alias, sqlWithoutAlias: expr.alias };
					}

					return expr;
				})
				.filter((expr): expr is ProcessedColumnExpression => !!expr)
		);
	});

	// Efficiently compute search columns - early exit when search is disabled
	readonly searchColumns = $derived.by(() => {
		if (!this.attributes.search) {
			return [];
		}

		if (!this.searchTerm.trim()) {
			return [];
		}

		// Use the SQL alias (not columnIdForRendering) so that search references
		// columns that exist in the main query SELECT, not fragment-only columns
		// like comparison display types (e.g. sum_total_sales_pct).
		// Exclude sparkline measures (only in fragment CTEs) and hidden columns.
		const searchableMeasures = this.allUnifiedColumns
			.filter(
				(col) =>
					col.type === 'measure' &&
					col.processedColumnExpression?.hasAgg &&
					col.viz !== 'sparkline' &&
					!col.hide
			)
			.map((col) => col.alias);

		const dimensionAliases = this.allUnifiedColumns
			.filter((col) => col.type === 'dimension' && !col.hide)
			.map((col) => col.alias);

		const pivotAliases = this.allUnifiedColumns
			.filter((col) => col.type === 'pivot' && !col.hide)
			.map((col) => col.alias);

		let searchableColumns = [...dimensionAliases, ...pivotAliases, ...searchableMeasures].filter(
			Boolean
		);

		// For plain tables (no explicit columns), use cached column names from
		// the first successful query result. This avoids a reactive cycle where
		// searchColumns → queryConfig → query → query.result → searchColumns.
		if (searchableColumns.length === 0) {
			searchableColumns = this._cachedResultColumnNames;
		}

		return searchableColumns;
	});
}
