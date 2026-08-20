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
		validateVariablesInComponent()
	),
	attributes: (() => {
		const {
			x_sort: _x_sort,
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
					'Sort order for y-axis categories. Options: `asc` (alphabetical), `desc` (reverse alphabetical), `data` (preserve query order), or an array for custom order like `["A", "B", "C"]`',
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
		}
	]
} as const satisfies UserComponentSchema;
