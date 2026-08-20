import type { Comparison } from '../../common/build-comparisons';
import type { SparklineColumnProps } from '../../common/build-sparklines';
import type { ProcessedColumnExpression } from '../../common/sql-expression-utils';
import {
	deltaOptionsSchema,
	sparklineOptionsSchema,
	barOptionsSchema,
	colorOptionsSchema
} from './measure/schema';
import { imageOptionsSchema, logoOptionsSchema } from './dimension/schema';
import { z } from 'zod';

export interface UnifiedColumnDefinition {
	type: 'dimension' | 'measure' | 'pivot';
	sqlWithAlias: string;
	alias: string; // column name in query result
	columnIdForRendering: string; // column name to use for data lookup in pivot/rendering (differs for comparisons)

	// Processed column expression (for query system)
	processedColumnExpression?: ProcessedColumnExpression;

	// Common properties
	title?: string;
	align?: 'left' | 'right' | 'center';
	info?: string;
	info_link?: string;
	info_link_title?: string;
	hide?: boolean;
	fmt?: string;
	sort?: 'asc' | 'desc';
	red_negatives?: boolean;

	// Measure-specific properties
	fmt_column?: string;
	// Fragment columns: hidden SQL columns that provide visualization data for this measure
	// When this measure is pivoted, these fragments are also pivoted alongside it
	// Examples: conditional_colors (explicit color values), scale_column (custom scale values)
	fragmentColumnAliases?: string[];

	// Visualization configuration
	viz?: 'bar' | 'color' | 'delta' | 'sparkline';

	// Visualization properties (replaces viz object)
	delta_options?: z.infer<typeof deltaOptionsSchema>;
	sparkline_options?: z.infer<typeof sparklineOptionsSchema>;
	bar_options?: z.infer<typeof barOptionsSchema>;
	color_options?: z.infer<typeof colorOptionsSchema>;
	viz_include_subtotals?: boolean;

	// Dimension-specific properties
	wrap?: boolean;
	repeat_values?: boolean; // Whether to repeat dimension value on every row (overrides table-level repeat_values)

	// Content and link properties (flat structure)
	html?: boolean;
	image_options?: z.infer<typeof imageOptionsSchema>;
	image?: string; // Image URL column/expression
	logo?: string; // Domain column/expression for Logo.dev
	logo_options?: z.infer<typeof logoOptionsSchema>;
	link?: string; // URL column/expression
	link_label?: string; // Static label text
	link_new_tab?: boolean; // Open in new tab

	// Date-related properties
	date_grain?: string;
	isTemporalDateGrain?: boolean; // Flag to indicate if this should be treated as a temporal date for comparison logic

	// Subtotal control properties
	hide_column_totals?: boolean;
	hide_row_totals?: boolean;

	// Sparkline visualization config (for ECharts rendering)
	sparklineVizConfig?: SparklineColumnProps;

	// Comparison metadata for tooltips
	comparison?: Comparison;

	// Base column metadata for comparisons and transformations
	sqlWithoutAlias?: string; // Expression after transformations but without alias (e.g., "sum(CASE WHEN <cond> THEN total_sales END)" or "toStartOfMonth(date)")
	isComplexExpression?: boolean; // Whether this expression requires subquery wrapping for subtotals
	hasAgg?: boolean; // Whether this measure contains aggregation functions
	appliedTransformations?: {
		dateRange?: string; // Applied date range (e.g., "Last 12 months")
		dateRangeShorthand?: string; // Shorthand version (e.g., "last_12_months")
		hasDateFiltering?: boolean;
	};

	// Column grouping
	column_group?: string; // Group name for visually grouping columns under a shared header
}
