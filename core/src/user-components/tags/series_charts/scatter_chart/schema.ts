import {
	and,
	validateSqlExpression,
	axisHasAggregation,
	validateEmptyAttributes
} from '../../../validators';
import type { UserComponentSchema } from '../../../types';
import { schema as comboChartSchema } from '../combo_chart/schema';
import { schema as scatterSeries } from '../scatter/schema';
import { schema as multiSeriesSchema } from '../MultiSeries/schema';
import { validateTooltipFieldFormats } from '../../../common/tooltip-fields';
import omit from 'lodash/omit';

export const schema = {
	render: 'scatter_chart',
	category: 'chart',
	description: 'Display a scatter chart',
	keywords: ['scatter plot', 'xy chart', 'xy plot', 'point chart', 'correlation'],
	validate: and(
		comboChartSchema.validate,
		validateSqlExpression('y', 'data', 'select'),
		validateSqlExpression('y2', 'data', 'select'),
		validateSqlExpression('tooltip_fields', 'data', 'select'),
		validateTooltipFieldFormats,
		axisHasAggregation('x', 'y', { getXFromParent: true }),
		validateEmptyAttributes()
	),
	attributes: {
		...comboChartSchema.attributes,
		// combo_chart made data/x optional to allow all-metric-children combos —
		// but scatter_chart is a leaf chart, not a container of metric children,
		// so both are always required. Re-require here so the schema-level
		// "missing required attribute" surfaces at edit time.
		data: { ...comboChartSchema.attributes.data, required: true },
		x: { ...comboChartSchema.attributes.x, required: true },
		...omit(scatterSeries.attributes, 'axis', 'echarts_options'),
		...multiSeriesSchema.attributes,
		size: {
			type: String,
			required: false,
			description: 'Column name for size of scatter points',
			suggestionType: 'sql',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'column'
		},
		size_fmt: {
			type: String,
			required: false,
			description: 'Format for size values in tooltips',
			suggestionType: 'format',
			supportsVariables: true,
			variableContext: 'text'
		}
	},
	allowedChildren: ['reference_line', 'reference_area', 'reference_point'],
	componentWrapper: comboChartSchema.componentWrapper,
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% scatter_chart
    data="demo.daily_orders"
    x="avg(avg_transaction_value)"
    y="sum(total_sales)"
    series="category"
/%}
`
		},
		{
			title: 'Scatter Chart with Formatting',
			example: `
{% scatter_chart
    data="demo.daily_orders"
    x="avg(avg_transaction_value)"
    y="sum(total_sales)"
    x_fmt="usd"
    y_fmt="usd"
    title="Sales vs Transaction Value"
    subtitle="Correlation between average transaction value and total sales"
    series="category"
/%}
`
		},
		{
			title: 'Scatter Chart with Point Titles',
			example: `
{% scatter_chart
    data="demo.daily_orders"
    x="avg(avg_transaction_value)"
    y="sum(total_sales)"
    point_title="category"
    x_fmt="usd"
    y_fmt="usd"
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
