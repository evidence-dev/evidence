import type { UserComponentSchema } from '../../../types';
import { schema as comboChartSchema } from '../combo_chart/schema';
import { schema as seriesSchema } from '../combo_chart/series/schema';
import { barOptionsAttribute } from '../bar/schema';
import {
	and,
	validateSqlExpression,
	axisHasAggregation,
	validateEmptyAttributes,
	validateDateAttributes,
	validateDateRange,
	tableExists,
	filtersExist,
	validateSqlOptions,
	validateInfoRequiresTitle,
	validateFormatCode,
	validateVariablesInComponent,
	validateValueAxisType,
	validateAxisMinMax
} from '../../../validators';
import { ZodAttribute } from '../../../common/zod-attribute';
import { getTableFromContext, isValidationContext, stripTypeCast } from '../../../validators/types';
import { z } from 'zod';
import {
	TOOLTIP_FIELDS_ATTRIBUTE,
	validateTooltipFieldFormats
} from '../../../common/tooltip-fields';

export const schema = {
	render: 'horizontal_bar_chart',
	category: 'chart',
	description: 'Display a horizontal bar chart',
	keywords: ['horizontal bar graph', 'row chart'],
	validate: and(
		// Don't use comboChartSchema.validate - it checks date_grain against x, but horizontal bar uses y for categories
		tableExists('data'),
		filtersExist('filters'),
		validateSqlExpression('x', 'data', 'select'),
		validateSqlExpression('y', 'data', 'select'),
		validateSqlExpression('series', 'data', 'select'),
		validateSqlExpression('tooltip_fields', 'data', 'select'),
		validateTooltipFieldFormats,
		// Use 'y' as the date column check (4th param) since horizontal bar has categories on y-axis
		validateDateAttributes('date', 'date_range', 'data', 'y'),
		validateDateRange(),
		validateSqlOptions(),
		validateInfoRequiresTitle,
		axisHasAggregation('y', 'x', { getXFromParent: true }),
		validateValueAxisType('x', {
			categoryAxisAttribute: 'y',
			swappedAxesChartSuggestion: 'bar_chart'
		}),
		validateFormatCode('x_fmt'),
		validateFormatCode('y_fmt'),
		validateAxisMinMax('x_axis_options'),
		validateEmptyAttributes(),
		validateVariablesInComponent(),
		// Warn when both `sort` (new) and `y_sort` (legacy category-axis sort
		// on this chart) are set. `sort` wins silently; author would wonder
		// why `y_sort` edits are ignored.
		(node) => {
			if (!node.attributes?.sort || !node.attributes?.y_sort) return [];
			return [
				{
					id: 'sort-shadows-y-sort',
					level: 'warning' as const,
					message:
						'Both `sort` (new) and `y_sort` (legacy) are set. `sort` wins — `y_sort` is ignored. Remove one of them.',
					location: node.location
				}
			];
		},
		// Same warning for `order=` — raw ORDER BY escape hatch silently
		// clobbered by `sort`.
		(node) => {
			if (!node.attributes?.sort || !node.attributes?.order) return [];
			return [
				{
					id: 'sort-shadows-order',
					level: 'warning' as const,
					message:
						'Both `sort` and `order=` are set. `sort` wins — the `order=` clause is ignored.',
					location: node.location
				}
			];
		},
		// Same time-axis story as combo_chart — but the CATEGORY axis on this
		// chart is y (categories run vertically), so we check the y column
		// (not x) for date-ness. Three signals: `date_grain=`, an explicit
		// `y_axis_options.type="time"`, or a date/datetime column type from
		// catalog metadata.
		(node, _config, context) => {
			const sort = node.attributes?.sort;
			if (!sort) return [];

			const hasDateGrain = node.attributes?.date_grain !== undefined;
			const yAxisType = (node.attributes?.y_axis_options as { type?: string } | undefined)?.type;
			const axisOverrideIsTime = yAxisType === 'time';

			let yIsDateColumn = false;
			if (isValidationContext(context)) {
				const yRaw = node.attributes?.y;
				const tableName = node.attributes?.data;
				if (
					typeof yRaw === 'string' &&
					typeof tableName === 'string' &&
					/^[A-Za-z_][A-Za-z0-9_]*$/.test(yRaw)
				) {
					const table = getTableFromContext(tableName, context);
					const column = table?.getColumn(stripTypeCast(yRaw));
					const columnType = (column?.type || '').toLowerCase();
					yIsDateColumn = /date|datetime|timestamp/.test(columnType);
				}
			}

			if (!hasDateGrain && !axisOverrideIsTime && !yIsDateColumn) return [];

			const shape = Array.isArray(sort) ? 'sort=[...]' : `sort="${sort}"`;
			return [
				{
					id: 'sort-effectively-ignored-on-time-axis',
					level: 'warning' as const,
					message: `${shape} has no visual effect on a time-axis horizontal chart — bars are positioned by their date/period value on the y (category) axis, not by array order. To rank by x (value) or by explicit category, cast the y column to a string / non-date and drop \`date_grain\`.`,
					location: node.location
				}
			];
		},
		// Warn about the axis-name flip: on `bar_chart` the value axis is y,
		// so `sort="y desc"` = biggest bars first. On `horizontal_bar_chart`
		// the axes swap, so the equivalent is `sort="x desc"`. An agent (or
		// human) porting a recipe verbatim from the vertical chart hits this
		// silently — the query still runs, the bars just don't sort the way
		// they expected. Sort attribute is always a bare string here (no
		// `y asc`/`y desc` on the array form).
		(node) => {
			const sort = node.attributes?.sort;
			if (sort !== 'y asc' && sort !== 'y desc') return [];
			const suggestion = sort === 'y desc' ? 'x desc' : 'x asc';
			return [
				{
					id: 'horizontal-bar-sort-axis-flip',
					level: 'warning' as const,
					message: `On horizontal_bar_chart the value axis is x, not y. sort="${sort}" sorts categories alphabetically along the y axis — probably not what you want. Use \`sort="${suggestion}"\` for "biggest bars first" (or the opposite), or an array like \`sort=["Enterprise", "SMB", "Consumer"]\` for an explicit category order.`,
					location: node.location
				}
			];
		}
	),
	attributes: (() => {
		const {
			x_sort: _x_sort,
			// Override combo_chart's `sort` description below — axis names match
			// but the semantics swap (x is the value, y is the category on this
			// chart), so the guidance has to be worded from that perspective.
			sort: _sort,
			y2_axis_options: _y2_axis_options,
			y2_fmt: _y2_fmt,
			...inheritedAttributes
		} = comboChartSchema.attributes;
		return {
			...inheritedAttributes,
			// combo_chart made data optional for all-metric-children combos —
			// horizontal_bar_chart is a leaf chart, so re-require it.
			data: { ...comboChartSchema.attributes.data, required: true },
			x: {
				type: String,
				required: true,
				description: 'Column name for x-axis (value, extends horizontally)',
				suggestionType: 'sql',
				affectsQuery: true,
				supportsVariables: true,
				variableContext: 'column'
			},
			x_fmt: {
				type: String,
				description: 'Format for x values',
				required: false,
				suggestionType: 'format',
				supportsVariables: true,
				variableContext: 'text'
			},
			y: {
				type: String,
				required: true,
				description: 'Column name for y-axis (category, extends vertically)',
				suggestionType: 'sql',
				affectsQuery: true,
				supportsVariables: true,
				variableContext: 'column'
			},
			y_sort: {
				type: ZodAttribute.create(
					z.union([z.enum(['asc', 'desc', 'data']), z.array(z.string())]).optional()
				),
				required: false,
				description:
					'Sort order for y-axis categories. Options: `asc` (alphabetical), `desc` (reverse alphabetical), `data` (preserve query order), or an array for custom order like `["A", "B", "C"]`. Prefer the newer `sort` prop for x/y direction sorting.',
				affectsQuery: true
			},
			sort: {
				type: ZodAttribute.create(
					z.union([z.enum(['x asc', 'x desc', 'y asc', 'y desc']), z.array(z.string())]).optional()
				),
				required: false,
				description:
					'Sort order for the bars. Axes are swapped from `bar_chart` — the value axis is `x` and the category axis is `y`, so for **biggest bars first use `sort="x desc"`** (NOT `sort="y desc"`, which sorts categories alphabetically). `"x asc"` / `"x desc"` sort by value. `"y asc"` / `"y desc"` sort the category axis alphabetically. An array like `["Enterprise", "SMB", "Consumer"]` renders categories in that explicit order. Leave unset and the chart preserves the source query\'s row order for non-aggregating charts, or defaults to biggest-first (`x desc`) for aggregating ones.',
				affectsQuery: true
			},
			series: {
				type: String,
				required: false,
				description: 'Column name for series',
				suggestionType: 'sql',
				affectsQuery: true,
				supportsVariables: true,
				variableContext: 'column'
			},
			x_axis_options: comboChartSchema.attributes.x_axis_options,
			y_axis_options: comboChartSchema.attributes.y_axis_options,
			data_labels: seriesSchema.attributes.data_labels,
			...TOOLTIP_FIELDS_ATTRIBUTE,
			bar_options: barOptionsAttribute,
			stacked: {
				type: Boolean,
				required: false,
				default: true,
				description: 'Whether to stack the bars'
			},
			// Override chart_options to exclude zoom (not applicable for horizontal bar charts)
			chart_options: {
				type: ZodAttribute.create(
					z.object({
						color_palette: z.array(z.string()).optional(),
						series_colors: z.record(z.string(), z.string()).optional(),
						top_padding: z
							.number()
							.optional()
							.default(0)
							.describe(
								'Additional padding (in px) above the chart area to prevent labels from being cut off'
							)
					})
				),
				required: false,
				description: 'Additional chart configuration options',
				affectsQuery: false
			}
		};
	})(),
	allowedChildren: ['reference_line', 'reference_area', 'reference_point'],
	componentWrapper: comboChartSchema.componentWrapper,
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% horizontal_bar_chart
	data="demo.daily_orders"
	y="category"
	x="sum(total_sales)"
/%}
`
		},
		{
			title: 'Sort bars biggest first',
			example: `
{% horizontal_bar_chart
	data="demo.daily_orders"
	y="category"
	x="sum(total_sales)"
	sort="x desc"
/%}
`
		},
		{
			title: 'Explicit category order',
			example: `
{% horizontal_bar_chart
	data="demo.daily_orders"
	y="category"
	x="sum(total_sales)"
	sort=["Enterprise", "SMB", "Consumer"]
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
