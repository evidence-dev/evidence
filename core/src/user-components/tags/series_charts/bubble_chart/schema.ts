import type { UserComponentSchema } from '../../../types';
import { schema as comboChartSchema } from '../combo_chart/schema';
import { schema as bubbleSchema } from '../bubble/schema';
import { and, validateSqlExpression, axisHasAggregation } from '../../../validators';
import { schema as multiSeriesSchema } from '../MultiSeries/schema';
import { validateTooltipFieldFormats } from '../../../common/tooltip-fields';
import omit from 'lodash/omit';

export const schema = {
	render: 'bubble_chart',
	category: 'chart',
	description: 'Display a bubble chart',
	keywords: ['bubble plot', 'bubble graph'],
	validate: and(
		comboChartSchema.validate,
		validateSqlExpression('y', 'data', 'select'),
		validateSqlExpression('y2', 'data', 'select'),
		validateSqlExpression('tooltip_fields', 'data', 'select'),
		validateTooltipFieldFormats,
		// No top-level validateEmptyAttributes — the embedded combo validate already covers it.
		axisHasAggregation('x', 'y', { getXFromParent: true })
	),
	attributes: {
		...comboChartSchema.attributes,
		// bubble_chart is a leaf chart, not a container of metric children —
		// re-require the pair combo_chart made optional for its all-metric case.
		data: { ...comboChartSchema.attributes.data, required: true },
		x: { ...comboChartSchema.attributes.x, required: true },
		...omit(bubbleSchema.attributes, 'axis', 'echarts_options'),
		...multiSeriesSchema.attributes,
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
{% bubble_chart
    data="demo.daily_orders"
    x="sum(total_sales)"
    y="avg(avg_transaction_value)"
    size="sum(transactions)"
    series="category"
/%}
`
		},
		{
			title: 'Bubble Chart with Formatting',
			example: `
{% bubble_chart
    data="demo.daily_orders"
    x="sum(total_sales)"
    y="avg(avg_transaction_value)"
    size="sum(transactions)"
    x_fmt="usd"
    y_fmt="usd"
    title="Sales Performance Analysis"
    subtitle="Bubble size represents transaction count"
    series="category"
/%}
`
		},
		{
			title: 'Bubble Chart with Point Titles',
			example: `
{% bubble_chart
    data="demo.daily_orders"
    x="sum(total_sales)"
    y="avg(avg_transaction_value)"
    size="sum(transactions)"
    point_title="category"
    x_fmt="usd"
    y_fmt="usd"
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
