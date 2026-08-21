import { type UserComponentProps } from '../../../types';
import type { schema } from './schema';
import {
	applyAggregateFilter,
	hasAgg,
	processColumnExpression,
	type ProcessedColumnExpression
} from '../../../common/sql-expression-utils';
import { TableModel } from '../TableModel.svelte';
import type { UnifiedColumnDefinition } from '../unified-column-definition.types';
import { getDateRangeShorthand, processDateRange } from '../../../common/date-options';
import { parseDateStringAsLocalMidnight } from '../../../../utils/date-utils';
import {
	UserComponentModel,
	type WithDefaults,
	type UserComponentModelInit
} from '../../../UserComponentModel';
import { resolveComparisonFromSelector } from '../../../common/parse-comparison-selector';
import { resolveMetric } from '../../../../metrics/resolve-metric';

type MeasureAttributes = UserComponentProps<typeof schema>;

type MeasureModelGenerics = WithDefaults<{
	Attributes: MeasureAttributes;
	ParentRequired: true;
	ValidParents: [typeof TableModel];
	ValidChildren: [];
}>;

export class MeasureModel extends UserComponentModel<MeasureModelGenerics> {
	constructor(init: UserComponentModelInit<MeasureModelGenerics>) {
		super(init, {
			parentRequired: true,
			validParentClasses: [TableModel],
			validChildClasses: []
		});
	}

	// `metric="revenue"` resolves the aggregate SQL, format, and label from the
	// catalog (shared helper, same as big_value/charts). The metric's base also
	// feeds the parent table's FROM via `metricBase`.
	readonly resolvedMetric = $derived(this.resolveText(this.attributes.metric));
	readonly metricCompiled = $derived(
		resolveMetric(this.metricsCatalog, this.resolvedMetric, this.deps.connection.dialect)
	);
	/** The metric view's base relation, for the parent table to use as its FROM. */
	get metricBase(): string | undefined {
		return this.metricCompiled?.base;
	}

	// Resolve attributes with variable interpolation. In metric mode the value is
	// the metric's aggregate expression, aliased by the metric name.
	readonly resolvedValue = $derived.by((): string => {
		if (this.metricCompiled?.valueExpression) {
			return `${this.metricCompiled.valueExpression} AS ${this.deps.connection.dialect.quoteAlias(this.metricCompiled.name)}`;
		}
		return this.resolveColumn(this.attributes.value) ?? '';
	});
	// Explicit title/fmt win; otherwise inherit the metric's label/format.
	readonly resolvedTitle = $derived(
		this.resolveText(this.attributes.title) ?? this.metricCompiled?.displayLabel
	);
	readonly resolvedInfo = $derived(this.resolveText(this.attributes.info));
	readonly resolvedInfo_link = $derived(this.resolveText(this.attributes.info_link));
	readonly resolvedInfo_link_title = $derived(this.resolveText(this.attributes.info_link_title));
	readonly resolvedFmt = $derived.by(() => {
		const explicit = this.resolveText(this.attributes.fmt);
		if (explicit) return explicit;
		return this.metricCompiled?.columnFormats[this.metricCompiled.name];
	});
	readonly resolvedHide = $derived(this.resolveBoolean(this.attributes.hide));

	// Resolve nested objects - recursively handles all string properties
	readonly resolvedDateRange = $derived.by(() => {
		if (!this.attributes.date_range) return undefined;
		return this.resolveText(this.attributes.date_range);
	});

	// Resolve comparison.compare_vs for variables and selector config
	readonly resolvedComparison = $derived.by(() => {
		if (!this.attributes.comparison) return undefined;

		// Process variables in compare_vs (might be a selector reference like "{{comp}}")
		const processedCompareVs = this.processVariables(this.attributes.comparison.compare_vs, 'text');

		// Build comparison with resolved compare_vs, keeping original types
		const processedComparison = {
			...this.attributes.comparison,
			compare_vs: processedCompareVs
		};

		// Then resolve selector config if compare_vs contains a JSON config
		return resolveComparisonFromSelector(processedComparison);
	});

	readonly resolvedSparklineOptions = $derived.by(() => {
		if (!this.attributes.sparkline_options) return undefined;
		return this.resolveText(this.attributes.sparkline_options);
	});

	readonly resolvedViz = $derived(this.resolveText(this.attributes.viz));
	readonly resolvedFmtColumn = $derived(this.resolveColumn(this.attributes.fmt_column));

	readonly columns: UnifiedColumnDefinition[] = $derived.by(() => {
		if (this.hasBlockingError) return [];
		// Metric reference that didn't resolve → no column (edit-time validation
		// flags it); never emit a broken column.
		if (this.resolvedMetric && !this.metricCompiled) return [];

		const {
			sort,
			red_negatives,
			hide_column_totals,
			hide_row_totals,
			viz_include_subtotals,
			delta_options,
			bar_options,
			color_options,
			align,
			column_group
		} = this.attributes;
		// Use resolved versions for props with variable support
		const fmt_column = this.resolvedFmtColumn;
		const viz = this.resolvedViz;
		const sparkline_options = this.resolvedSparklineOptions;
		const fmt = this.resolvedFmt;
		const hide = this.resolvedHide as boolean | undefined;

		// Use resolved comparison with interpolated variables
		const comparison = this.resolvedComparison;
		const comparison_display_type = comparison?.display_type ?? 'pct';
		const target = comparison?.target;

		// Calculate base column metadata once for all measure types
		const baseExpression = this.processedColumn.sqlWithoutAlias;
		const alias = this.processedColumn.alias;

		const appliedTransformations = {
			dateRange: this.resolvedDateRange?.range,
			dateRangeShorthand: this.resolvedDateRange?.range
				? getDateRangeShorthand(this.resolvedDateRange.range)
				: undefined,
			hasDateFiltering: this.processedColumn.hasDateRange,
			hasAgg: this.processedColumn.hasAgg
		};

		// Process scale_column expression if specified (for color viz)
		// Store processed info for reuse when adding fragment column
		let scaleColumnInfo:
			| { original: string; processed: ProcessedColumnExpression; alias: string }
			| undefined;
		let conditionalColorsInfo:
			| { original: string; processed: ProcessedColumnExpression; alias: string }
			| undefined;
		let processedColorOptions = color_options;

		if (color_options?.scale_column && viz === 'color') {
			const scaleColumnProcessed = processColumnExpression(
				{
					value: color_options.scale_column,
					type: 'measure',
					firstDayOfWeek: this.projectSettings.first_day_of_week
				},
				this.deps.connection.dialect
			);

			scaleColumnInfo = {
				original: color_options.scale_column,
				processed: scaleColumnProcessed,
				alias: scaleColumnProcessed.alias
			};

			// Update color_options to use the processed alias instead of the original expression
			processedColorOptions = {
				...color_options,
				scale_column: scaleColumnProcessed.alias
			};
		}

		if (color_options?.conditional_colors && viz === 'color') {
			const conditionalColorsProcessed = processColumnExpression(
				{
					value: color_options.conditional_colors,
					type: 'measure',
					firstDayOfWeek: this.projectSettings.first_day_of_week
				},
				this.deps.connection.dialect
			);

			conditionalColorsInfo = {
				original: color_options.conditional_colors,
				processed: conditionalColorsProcessed,
				alias: conditionalColorsProcessed.alias
			};

			// Update color_options to use the processed alias
			processedColorOptions = processedColorOptions
				? {
						...processedColorOptions,
						conditional_colors: conditionalColorsProcessed.alias
					}
				: {
						conditional_colors: conditionalColorsProcessed.alias,
						scale_mode: 'individual' as const
					};
		}

		// Base configuration shared by all measure types
		const baseConfig = {
			type: 'measure' as const,
			baseExpression,
			appliedTransformations,
			// Display properties
			fmt: fmt,
			fmt_column: fmt_column,
			title: this.resolvedTitle,
			info: this.resolvedInfo,
			info_link: this.resolvedInfo_link,
			info_link_title: this.resolvedInfo_link_title,
			hide: hide,
			sort: sort,
			red_negatives: red_negatives,
			// Only include hide props if explicitly set (not undefined)
			...(hide_column_totals !== undefined && { hide_column_totals: hide_column_totals }),
			...(hide_row_totals !== undefined && { hide_row_totals: hide_row_totals }),
			// New flat structure
			viz: viz,
			viz_include_subtotals: viz_include_subtotals,
			// Individual visualization options
			delta_options: delta_options,
			sparkline_options: sparkline_options,
			bar_options: bar_options,
			color_options: processedColorOptions,
			// Column grouping
			column_group: column_group
		};

		// Determine configuration based on measure type
		let defaultAlign: 'left' | 'right' | 'center' = 'right';
		const additionalProps: Record<string, unknown> = {};

		// Handle sparkline measures
		if (viz === 'sparkline') {
			defaultAlign = 'center';

			additionalProps.sparklineVizConfig = {
				id: this.processedColumn.alias, // Use processed alias (already has sparkline suffix)
				x: sparkline_options?.x,
				y: this.processedColumn.sqlWithoutAlias, // Use processed SQL expression
				type: sparkline_options?.type ?? 'line',
				color: sparkline_options?.color,
				title: this.resolvedTitle,
				info: this.resolvedInfo,
				info_link: this.resolvedInfo_link,
				info_link_title: this.resolvedInfo_link_title,
				fit_to_data: sparkline_options?.fit_to_data ?? false,
				date_range: sparkline_options?.date_range || this.resolvedDateRange,
				date_grain: sparkline_options?.date_grain ?? 'month'
			};
		}

		// Handle comparison measures
		const hasComparison = comparison && comparison.compare_vs;

		if (hasComparison) {
			// Process target column with date filtering if needed
			let processedTargetColumn = target;
			if (
				comparison!.compare_vs === 'target' &&
				target &&
				appliedTransformations.hasDateFiltering
			) {
				const anchorDate = this.projectSettings.computedDefaultDateRangeEnd
					? parseDateStringAsLocalMidnight(this.projectSettings.computedDefaultDateRangeEnd)
					: new Date();
				const processed = processDateRange(
					this.resolvedDateRange?.range,
					this.resolvedDateRange?.date,
					anchorDate,
					this.projectSettings.first_day_of_week,
					this.deps.connection.dialect
				);
				if (processed.whereClause) {
					const targetNeedsAggregation = !hasAgg(target, this.deps.connection.dialect);
					const targetBase = targetNeedsAggregation ? `sum(${target})` : target;
					processedTargetColumn = applyAggregateFilter(
						targetBase,
						processed.whereClause,
						this.deps.connection.dialect
					);
				}
			}

			additionalProps.comparison = {
				compare_vs: comparison!.compare_vs as
					| 'prior year'
					| 'prior period'
					| 'target'
					| 'benchmark',
				display_type: comparison_display_type,
				id: alias, // Use the processed alias directly (this determines SQL column names)
				name: comparison!.name as string | undefined, // Custom comparison name for display
				date_range: this.resolvedDateRange,
				targetColumn:
					comparison!.compare_vs === 'target' && processedTargetColumn
						? processedTargetColumn
						: undefined,
				benchmark: comparison!.benchmark,
				abs_fmt: comparison!.abs_fmt,
				pct_fmt: comparison!.pct_fmt,
				hide_pct: comparison!.hide_pct
			};
		}

		// Track fragment column aliases
		// Fragment columns are hidden columns added to the SQL query to support visualization features.
		// They need to be tracked here so they can be pivoted alongside their parent measure.
		// To add a new fragment column: 1) create it and push to columnsToReturn, 2) push its alias here
		const fragmentAliases: string[] = [];

		// Build columnIdForRendering - use simple alias + display type for cleaner titles
		const columnIdForRendering = hasComparison ? `${alias}_${comparison_display_type}` : alias;

		// Build final configuration
		const mainColumn: UnifiedColumnDefinition = {
			...baseConfig,
			...additionalProps,
			processedColumnExpression: this.processedColumn,
			sqlWithAlias: this.processedColumn.sqlWithAlias,
			alias: this.processedColumn.alias,
			columnIdForRendering: columnIdForRendering,
			sqlWithoutAlias: this.processedColumn.sqlWithoutAlias,
			isComplexExpression: this.processedColumn.isComplexExpression,
			align: align !== undefined ? align : defaultAlign,
			fragmentColumnAliases: undefined // Will be set below if there are fragments
		};

		const columnsToReturn: UnifiedColumnDefinition[] = [mainColumn];

		// === FRAGMENT COLUMNS ===
		// Fragment columns are hidden columns added to SQL for visualization data (colors, scale values, etc.)
		// Pattern: 1) Create column with hide:true, 2) Push to columnsToReturn, 3) Push alias to fragmentAliases
		// The pivot logic will automatically duplicate these for each pivot value alongside the parent measure

		// Add scale_column as a hidden fragment column if specified and it's for color viz
		if (scaleColumnInfo) {
			const { processed: scaleColumnProcessed } = scaleColumnInfo;

			// Check if this column/expression is already defined in the table
			const parentTable = this.parent as TableModel | undefined;
			const propDimensions = parentTable?.attributes.dimensions || [];
			const propMeasures = parentTable?.attributes.measures || [];
			const propPivots = parentTable?.attributes.pivots || [];

			// Extract aliases from prop-based columns
			const processAndGetAlias = (expr: string) => {
				const processed = processColumnExpression(
					{
						value: expr,
						type: 'dimension',
						firstDayOfWeek: this.projectSettings.first_day_of_week
					},
					this.deps.connection.dialect
				);
				return processed.alias;
			};

			const existingAliases = [
				...propDimensions.filter((d): d is string => typeof d === 'string').map(processAndGetAlias),
				...propMeasures.filter((m): m is string => typeof m === 'string').map(processAndGetAlias),
				...propPivots.filter((p): p is string => typeof p === 'string').map(processAndGetAlias)
			];

			// Only add scale_column if it's not already defined
			if (!existingAliases.includes(scaleColumnProcessed.alias)) {
				// Determine the SQL to use based on whether it already has aggregation
				let sqlExpression: string;
				if (scaleColumnProcessed.hasAgg) {
					// Already aggregated (e.g., "sum(sc)")
					sqlExpression = scaleColumnProcessed.sqlWithAlias;
				} else {
					// Not aggregated - wrap with the dialect's any-value aggregate and use
					// the processed alias. For simple columns like "sc", alias is "sc"
					// For expressions, alias is generated from the expression
					sqlExpression = `${this.deps.connection.dialect.anyValue(scaleColumnProcessed.sqlWithoutAlias)} as ${scaleColumnProcessed.alias}`;
				}

				// Process the final expression
				const finalProcessed = processColumnExpression(
					{
						value: sqlExpression,
						type: 'measure',
						firstDayOfWeek: this.projectSettings.first_day_of_week
					},
					this.deps.connection.dialect
				);

				columnsToReturn.push({
					type: 'measure',
					processedColumnExpression: finalProcessed,
					sqlWithAlias: finalProcessed.sqlWithAlias,
					alias: finalProcessed.alias,
					columnIdForRendering: finalProcessed.alias,
					sqlWithoutAlias: finalProcessed.sqlWithoutAlias,
					isComplexExpression: finalProcessed.isComplexExpression,
					hide: true, // Hide this column from display
					align: 'right'
				});

				// Track this fragment column
				fragmentAliases.push(finalProcessed.alias);
			}
		}

		// Add conditional_colors as a hidden fragment column if specified and it's for color viz
		if (conditionalColorsInfo) {
			const { processed: conditionalColorsProcessed } = conditionalColorsInfo;

			// Determine the SQL to use based on whether it already has aggregation
			let sqlExpression: string;
			if (conditionalColorsProcessed.hasAgg) {
				// Already aggregated
				sqlExpression = conditionalColorsProcessed.sqlWithAlias;
			} else {
				// Not aggregated - wrap with the dialect's any-value aggregate
				sqlExpression = `${this.deps.connection.dialect.anyValue(conditionalColorsProcessed.sqlWithoutAlias)} as ${conditionalColorsProcessed.alias}`;
			}

			// Process the final expression
			const finalProcessed = processColumnExpression(
				{
					value: sqlExpression,
					type: 'measure',
					firstDayOfWeek: this.projectSettings.first_day_of_week
				},
				this.deps.connection.dialect
			);

			columnsToReturn.push({
				type: 'measure',
				processedColumnExpression: finalProcessed,
				sqlWithAlias: finalProcessed.sqlWithAlias,
				alias: finalProcessed.alias,
				columnIdForRendering: finalProcessed.alias,
				sqlWithoutAlias: finalProcessed.sqlWithoutAlias,
				isComplexExpression: finalProcessed.isComplexExpression,
				hide: true, // Hide this column from display
				align: 'right'
			});

			// Track this fragment column
			fragmentAliases.push(finalProcessed.alias);
		}

		// Set fragmentColumnAliases on main column if we have any fragments
		if (fragmentAliases.length > 0) {
			mainColumn.fragmentColumnAliases = fragmentAliases;
		}

		return columnsToReturn;
	});

	/**
	 * Compute anchor date for date range calculations
	 * Uses project default date range end or falls back to current date
	 */
	private readonly anchorDate = $derived.by(() => {
		if (this.projectSettings.computedDefaultDateRangeEnd) {
			return parseDateStringAsLocalMidnight(this.projectSettings.computedDefaultDateRangeEnd);
		}
		return new Date();
	});

	private readonly processedColumn: ProcessedColumnExpression = $derived.by(() => {
		const comparison = this.resolvedComparison;
		return processColumnExpression(
			{
				value: this.resolvedValue,
				type: 'measure',
				dateRange: this.resolvedDateRange, // Use resolved date range
				isTableSparkline: this.attributes.viz === 'sparkline',
				isTableComparison: !!(comparison && comparison.compare_vs),
				comparisonType: comparison?.compare_vs,
				firstDayOfWeek: this.projectSettings.first_day_of_week,
				anchorDate: this.anchorDate
			},
			this.deps.connection.dialect
		);
	});
}
