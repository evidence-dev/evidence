import type { UserComponentSchema } from '../../types';
import {
	and,
	tableExists,
	validateDateAttributes,
	validateDateRange,
	validateSqlOptions,
	validateSqlExpression,
	validateInfoRequiresTitle,
	validateFormatCode,
	validateEmptyAttributes,
	validateNumberRange,
	filtersExist,
	validateVariablesInComponent
} from '../../validators';
import type { Validator } from '../../validators/types';
import { isValidationContext } from '../../validators/types';
import type { Node } from '@markdoc/markdoc';
import { DATE_RANGE_ATTRIBUTE } from '../../common/date-options';
import { SQL_OPTIONS, REFRESH_INTERVAL_ATTRIBUTE } from '../../common/sql-options';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';

/** True when the table has a `{% measure metric="..." /%}` child (its base is derived from the metric). */
const hasMetricMeasureChild = (node: Node): boolean =>
	(node.children ?? []).some(
		(child) => child.tag === 'measure' && Boolean(child.attributes?.metric)
	);

/**
 * A table needs a data source: either an explicit `data` table, or a
 * `{% measure metric="..." /%}` child whose metric view supplies the base.
 */
const validSource: Validator = (node) => {
	const a = node.attributes ?? {};
	if (a.data || hasMetricMeasureChild(node)) return [];
	return [
		{
			id: 'missing-source',
			level: 'error',
			message: 'Set a `data` table, or add a {% measure metric="..." /%} child.',
			location: node.location
		}
	];
};

const attributes = {
	data: {
		type: String,
		required: false,
		// Kept in the slash-command scaffold (raw-mode default) though not required.
		suggested: true,
		suggestionType: 'table',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'text'
	},
	filters: {
		type: Array,
		required: false,
		suggestionType: 'filter',
		affectsQuery: true
	},
	...DATE_RANGE_ATTRIBUTE,
	...SQL_OPTIONS,
	title: {
		type: String,
		required: false,
		description: 'Title to display above the table',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	subtitle: {
		type: String,
		required: false,
		description: 'Subtitle to display below the title',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	info: {
		type: String,
		required: false,
		description:
			'Info text to display in a tooltip next to the title. Can only be used with the title prop.',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	info_link: {
		type: String,
		required: false,
		description: 'URL to link the info text to (can only be used with info)',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	info_link_title: {
		type: String,
		required: false,
		description:
			'Create a custom link title for the info link, placed after the info text (can only be used with info_link)',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	dimensions: {
		type: Array,
		required: false,
		suggestionType: 'column',
		affectsQuery: true,
		description:
			'Array of dimension column names or SQL expressions. Each item must be a string (e.g., ["column_name", "count(category) as count"])',
		default: []
	},
	pivots: {
		type: Array,
		required: false,
		suggestionType: 'column',
		affectsQuery: true,
		description:
			'Array of pivot column names or SQL expressions. These will be pivoted in the table output. Each item must be a string (e.g., ["category", "region"])',
		default: []
	},
	measures: {
		type: Array,
		required: false,
		suggestionType: 'sql',
		affectsQuery: true,
		description:
			'Array of SQL expressions for aggregations. Each item must be a string (e.g., ["sum(transactions)", "avg(value) as average"])',
		default: []
	},
	subtotals: {
		type: Boolean,
		required: false,
		default: true,
		description: 'Whether to include subtotals and totals in the table'
	},
	total_label: {
		type: String,
		required: false,
		default: 'Total',
		description:
			'The label to display in total/subtotal rows and columns. Useful when using non-sum aggregations like avg, min, max, or count.',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	show_total_row: {
		type: Boolean,
		required: false,
		default: true,
		description:
			'Whether to display the total row at the bottom. Only applies when subtotals=true. Note: Temporal comparisons may hide totals even when this is true.'
	},
	show_subtotal_rows: {
		type: Boolean,
		required: false,
		default: true,
		description:
			'Whether to display intermediate subtotal rows. Only applies when subtotals=true. Note: Temporal comparisons may hide subtotals even when this is true.'
	},
	show_total_column: {
		type: Boolean,
		required: false,
		default: true,
		description:
			'Whether to display the total column in pivoted tables. Only applies when subtotals=true and pivots are used.'
	},
	show_subtotal_columns: {
		type: Boolean,
		required: false,
		default: true,
		description:
			'Whether to display intermediate subtotal columns in pivoted tables. Only applies when subtotals=true and pivots are used.'
	},
	measures_first: {
		type: Boolean,
		required: false,
		default: false,
		description:
			'Whether to put measures before pivots in the column hierarchy (e.g., Sales > 2021|2022 instead of 2021|2022 > Sales)'
	},
	page_size: {
		type: Number,
		required: false,
		description: 'Number of rows to display per page in pagination (maximum 200)',
		affectsQuery: false,
		default: 10
	},
	search: {
		type: Boolean,
		required: false,
		default: false,
		description: 'Whether to display a search box above the table for filtering results',
		affectsQuery: false
	},
	format_titles: {
		type: Boolean,
		required: false,
		default: true,
		description:
			'Whether to apply formatting to column titles. When false, titles will be displayed as-is.',
		affectsQuery: false
	},
	wrap_titles: {
		type: Boolean,
		required: false,
		default: true,
		description:
			'Whether to allow column titles to wrap across multiple lines. When false, titles will be on a single line.',
		affectsQuery: false
	},
	wrap: {
		type: Boolean,
		required: false,
		default: false,
		description:
			'Whether to allow table cell content to wrap across multiple lines. When false, cell content will be on a single line.',
		affectsQuery: false
	},
	row_shading: {
		type: Boolean,
		required: false,
		// No default: unset falls through to the theme's table.rowShading (default false)
		description: 'Whether to apply alternating background colors to table rows for easier reading.',
		affectsQuery: false
	},
	row_lines: {
		type: Boolean,
		required: false,
		// No default: unset falls through to the theme's table.rowLines (default true)
		description:
			'Whether to display borders between table rows. When false, row borders are hidden.',
		affectsQuery: false
	},
	link: {
		type: String,
		required: false,
		suggestionType: 'column',
		description:
			'Column name containing URLs to make each row clickable. When specified, clicking a row will navigate to the URL in that column.',
		affectsQuery: false
	},
	show_link_column: {
		type: Boolean,
		required: false,
		default: false,
		description:
			'Whether to display the link column in the table. Only applies when no explicit columns are specified and the link prop is used.',
		affectsQuery: false
	},
	...REFRESH_INTERVAL_ATTRIBUTE,
	freeze_columns: {
		type: Number,
		required: false,
		description:
			'Number of left-most columns to freeze when scrolling horizontally. Frozen columns remain visible while the rest of the table scrolls.',
		affectsQuery: false,
		default: 0
	},
	repeat_values: {
		type: Boolean,
		required: false,
		default: false,
		description:
			'Whether to repeat dimension values on every row. When true, dimension values are displayed on every row even when they are the same as the row above.',
		affectsQuery: false
	},
	collapsible: {
		type: Boolean,
		required: false,
		default: false,
		description:
			'Whether to enable collapsible groups. When enabled, subtotal rows become clickable to expand/collapse their child rows. Only works when subtotals are enabled and there are dimensions. Note: pagination is disabled when collapsible is enabled.',
		affectsQuery: false
	},
	collapsed: {
		type: Boolean,
		required: false,
		default: undefined,
		description:
			'Whether all groups should start collapsed on initial load. Defaults to true when collapsible=true.',
		affectsQuery: false
	},
	subtotal_position: {
		type: String,
		required: false,
		matches: ['top', 'bottom'],
		default: undefined,
		description:
			'Where to position subtotal rows relative to their group data rows. "top" places subtotals before the detail rows, "bottom" places them after. Defaults to "top" when collapsible=true, otherwise "bottom".',
		affectsQuery: false
	},
	total_position: {
		type: String,
		required: false,
		matches: ['top', 'bottom'],
		default: 'bottom',
		description:
			'Where to position the grand total row. "top" places it as the first row, "bottom" places it as the last row (default).',
		affectsQuery: false
	},
	row_conditional_colors: {
		type: String,
		required: false,
		default: undefined,
		description:
			"SQL expression that returns a hex color for each row's background. Used to conditionally highlight entire rows based on data (e.g., \"case when sum(amount) > 10000 then '#dcfce7' else null end\").",
		affectsQuery: true,
		suggestionType: 'sql',
		supportsVariables: true,
		variableContext: 'column'
	},
	...WIDTH_ATTRIBUTE
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'table',
	category: 'table',
	selfClosing: false,
	validate: and(
		validSource,
		// These no-op when `data` is absent (metric-measure mode), so they don't
		// need gating: `tableExists` skips an empty name and `validateSqlExpression`
		// skips when the table can't be resolved.
		tableExists('data'),
		validateSqlExpression('measures', 'data', 'select'),
		validateSqlExpression('dimensions', 'data', 'select'),
		validateSqlExpression('pivots', 'data', 'select'),
		validateSqlExpression('row_conditional_colors', 'data', 'select'),
		validateDateAttributes(),
		validateDateRange(),
		validateSqlOptions(),
		validateInfoRequiresTitle,
		validateFormatCode('fmt'),
		validateEmptyAttributes(),
		validateNumberRange('page_size', {
			min: 1,
			max: 200,
			integersOnly: true
		}),
		validateNumberRange('freeze_columns', {
			min: 0,
			max: 10,
			integersOnly: true
		}),
		filtersExist('filters'),
		validateVariablesInComponent(),
		// Cross-child metric-base check. TableModel picks its FROM from the FIRST
		// metric-measure child's view base, so a sibling measure whose metric
		// belongs to a DIFFERENT view silently runs against the wrong table —
		// producing plausible-looking but wrong numbers with no error. Same
		// class of bug the combo_chart cross-child validator prevents; block it
		// at edit time here too. Also enforces that raw + metric measures don't
		// mix unless the parent's explicit `data=` matches the metric base
		// (otherwise the raw measure targets a different table than the metric
		// author intended).
		(node, _config, context) => {
			if (node.tag !== 'table') return [];
			if (!isValidationContext(context)) return [];
			const measureChildren = ((node.children ?? []) as Node[]).filter(
				(c) => c.tag === 'measure'
			);
			const catalog = context.metricsCatalog;
			if (!catalog) return [];

			// Collect view bases for every metric-driven measure that resolves.
			const metricBases: { name: string; base: string | undefined; baseSql: string | undefined }[] = [];
			for (const child of measureChildren) {
				const raw = child.attributes?.metric;
				const name =
					typeof raw === 'string'
						? raw.trim()
						: Array.isArray(raw) && typeof raw[0] === 'string'
							? raw[0].trim()
							: undefined;
				if (!name || /\{\{[^}]+\}\}/.test(name)) continue;
				const found = catalog.getMetric(name);
				if (!found) continue; // metricExists on the measure surfaces this
				metricBases.push({
					name,
					base: found.view.base,
					baseSql: found.view.baseSql
				});
			}

			if (metricBases.length > 1) {
				const first = metricBases[0];
				const mismatch = metricBases.find(
					(b) => b.base !== first.base || b.baseSql !== first.baseSql
				);
				if (mismatch) {
					const firstBase = first.base ?? '(inline base_sql)';
					const otherBase = mismatch.base ?? '(inline base_sql)';
					return [
						{
							id: 'table-measure-base-mismatch',
							level: 'error',
							message: `table: measure metric "${mismatch.name}" (base "${otherBase}") can't share a table with "${first.name}" (base "${firstBase}") — every measure must reference a metric from the same view. Split into two tables to combine data across metric views.`,
							location: node.location
						}
					];
				}
			}

			// Cross-base against parent `data=`: same shape as the combo_chart rule.
			// If the table declares its own `data=` AND a metric measure's base
			// differs, the measure's aggregate SQL runs against the wrong FROM.
			const parentData =
				typeof node.attributes?.data === 'string' && node.attributes.data.trim() !== ''
					? node.attributes.data.trim()
					: undefined;
			if (parentData && metricBases.length > 0) {
				const mismatch = metricBases.find((b) => b.base && b.base !== parentData);
				if (mismatch) {
					return [
						{
							id: 'table-measure-data-mismatch',
							level: 'error',
							message: `table \`data="${parentData}"\` doesn't match measure metric "${mismatch.name}"'s base ("${mismatch.base}"). Remove the table's \`data=\` (metric measures resolve their own base) or reference a metric whose view uses \`base: ${parentData}\`.`,
							location: node.location
						}
					];
				}
			}

			return [];
		},
		// Warn when subtotal_position is set with collapsible (it's forced to 'top')
		(node) => {
			const isCollapsible = node.attributes.collapsible === true;
			const hasSubtotalPosition = node.attributes.subtotal_position !== undefined;

			if (isCollapsible && hasSubtotalPosition) {
				return [
					{
						id: 'collapsible-ignores-subtotal-position',
						level: 'warning' as const,
						message:
							'table: "subtotal_position" has no effect when "collapsible=true". Collapsible tables require subtotals at the top of each group to function as expandable headers. You can remove the subtotal_position attribute.',
						location: node.location
					}
				];
			}
			return [];
		},
		// Warn when repeat_values is set with collapsible (rowspans are already disabled)
		(node) => {
			const isCollapsible = node.attributes.collapsible === true;
			const hasRepeatValues = node.attributes.repeat_values === true;

			if (isCollapsible && hasRepeatValues) {
				return [
					{
						id: 'collapsible-ignores-repeat-values',
						level: 'warning' as const,
						message:
							'table: "repeat_values" has no effect when "collapsible=true". Collapsible tables already disable row merging so each row can be independently shown/hidden. You can remove the repeat_values attribute.',
						location: node.location
					}
				];
			}
			return [];
		}
	),
	description: 'Display a table of data with dimensions, pivots, and measures',
	keywords: ['data table', 'grid', 'spreadsheet', 'pivot table'],
	attributes,
	allowedChildren: ['dimension', 'measure', 'pivot'],
	componentWrapper: {
		display: 'block',
		width: 'full',
		flex: {
			grow: 3,
			minWidth: 250
		}
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% table
    data="demo.daily_orders"
%}
    {% dimension
        value="category"
    /%}
    {% pivot
        value="date"
        date_grain="year"
    /%}
    {% measure
        value="sum(total_sales)"
        fmt="usd1m"
    /%}
{% /table %}
`
		},
		{
			title: 'Date Range Filtering',
			example: `
			{% table
  data="demo.daily_orders"
%}
  {% dimension
    value="category"
  /%}
  {% measure
    value="sum(total_sales)"
    date_range={
      range="last 12 months"
      date="date"
    }
    fmt="usd1m"
  /%}
  {% measure
    value="sum(total_sales)"
    date_range={
      range="last 6 months"
      date="date"
    }
    fmt="usd1m"
  /%}
{% /table %}
`
		},
		{
			title: 'Pivoting',
			example: `
{% table
  data="demo.daily_orders"
%}
  {% dimension
    value="category"
  /%}
  {% pivot
    value="date"
    date_grain="year"
  /%}
  {% measure
    value="sum(total_sales)"
    fmt="usd1m"
  /%}
{% /table %}			
`
		},
		{
			title: 'Prior Year Comparison',
			example: `
{% table
  data="demo.daily_orders"
%}
  {% dimension
    value="category"
  /%}
  {% measure
    value="sum(total_sales)"
    date_range={
      range="last 12 months"
      date="date"
    }
    comparison={
      compare_vs="prior year"
    }
  /%}
{% /table %}			
`
		},
		{
			title: 'Calculated Measures',
			example: `
{% table
  data="demo.daily_orders"
%}
  {% dimension
    value="category"
  /%}
  {% measure
    value="sum(total_sales) / sum(transactions) as avg_price" 
    fmt="usd2"
  /%}
{% /table %}
			
`
		},
		{
			title: 'Custom Grouping',
			example: `
{% table
  data="demo.daily_orders"
%}
  {% dimension
    value="case when category in ('Home','Clothing') then 'Home & Clothing' else 'Other' end as group"
  /%}
  {% dimension
    value="category"
  /%}
  {% measure
    value="sum(total_sales)"
    fmt="usd1m"
  /%}
  {% measure
    value="sum(total_sales) / sum(transactions) as avg_price"
    fmt="usd2"
  /%}
{% /table %}
			
`
		},
		{
			title: 'Viz: Color Scale',
			example: `
{% table
  data="demo.daily_orders"
%}
  {% dimension
    value="category"
  /%}
  {% measure
    value="sum(total_sales)"
    fmt="usd1m"
    viz="color"
  /%}
{% /table %}			
`
		},
		{
			title: 'Viz: Color Scale with Custom Colors',
			example: `
{% table
  data="demo.daily_orders"
%}
  {% dimension
    value="category"
  /%}
  {% measure
    value="sum(total_sales)"
    fmt="usd1m"
    viz="color"
    color_options={
      color_scale=["#c0392b","#f4f4f4","#27ae60"]
    }
  /%}
{% /table %}
			
`
		},
		{
			title: 'Viz: Bar',
			example: `
{% table
  data="demo.daily_orders"
%}
  {% dimension
    value="category"
  /%}
  {% measure
    value="sum(total_sales)"
    fmt="usd1m"
    viz="bar"
  /%}
{% /table %}			
`
		},
		{
			title: 'Viz: Bar with Custom Colors',
			example: `
			
{% table
  data="demo.daily_orders"
%}
  {% dimension
    value="category"
  /%}
  {% measure
    value="sum(total_sales)"
    fmt="usd1m"
    viz="bar"
    bar_options={
      bar_color="#2c7d00"
    }
  /%}
  {% measure
    value="sum(transactions)"
    viz="bar"
    bar_options={
      bar_color="#339e9c"
    }
  /%}
{% /table %}
`
		},
		{
			title: 'Viz: Delta',
			example: `
{% table
  data="demo.daily_orders"
%}
  {% dimension
    value="category"
  /%}
  {% measure
    value="sum(total_sales)"
    date_range={
      range="last 12 months"
      date="date"
    }
    comparison={
      compare_vs="prior year"
    }
    viz="delta"
  /%}
{% /table %}			
`
		},
		{
			title: 'Viz: Sparkline',
			example: `
{% table
  data="demo.daily_orders"
%}
  {% dimension
    value="category"
  /%}
  {% pivot
    value="date"
    date_grain="year"
  /%}
  {% measure
    value="sum(total_sales)"
    fmt="usd1m"
    viz="sparkline"
    sparkline_options={
      x="date"
      type="area"
    }
  /%}
{% /table %}			
`
		},
		{
			title: 'Links',
			example: `
{% table
  data="demo.daily_orders"
%}
  {% dimension
    value="category"
    link="concat('https://www.google.com/search?q=',category)"
    link_new_tab=true
  /%}
  {% measure
    value="sum(total_sales)"
  /%}
{% /table %}			
`
		},
		{
			title: 'Column Info',
			example: `
{% table
  data="demo.daily_orders"
%}
  {% dimension
    value="category"
  /%}
  {% measure
    value="sum(total_sales)"
    fmt="usd1m"
    info="Includes all product sales"
  /%}
{% /table %}			
`
		},
		{
			title: 'Sorting',
			example: `
{% table
  data="demo.daily_orders"
%}
  {% dimension
    value="category"
  /%}
  {% measure
    value="sum(total_sales)"
    fmt="usd1m"
    viz="color"
    sort="asc"
  /%}
{% /table %}			
`
		},
		{
			title: 'Date Grains: Day of Week',
			example: `
{% table
  data="demo.daily_orders"
%}
  {% dimension
    value="date"
    date_grain="day of week"
  /%}
  {% measure
    value="sum(total_sales)"
  /%}
{% /table %}			
`
		},
		{
			title: 'Repeat Dimension Values',
			example: `
{% table
  data="demo.daily_orders"
  repeat_values=true
%}
  {% dimension
    value="category"
  /%}
  {% dimension
    value="item"
  /%}
  {% measure
    value="sum(total_sales)"
    fmt="usd1m"
  /%}
{% /table %}			
`
		}
	]
} as const satisfies UserComponentSchema;
