import type { UserComponentSchema } from '../../../types';
import { schema as comboChartSchema } from '../combo_chart/schema';
import { barOptionsAttribute, schema as barSchema } from '../bar/schema';
import {
	and,
	validateSqlExpression,
	axisHasAggregation,
	validateEmptyAttributes,
	validateStackedProp,
	validateValueAxisType,
	metricExists
} from '../../../validators';
import { ifCondition } from '../../../validators/ifCondition';
import { schema as multiSeriesSchema } from '../MultiSeries/schema';
import { validateTooltipFieldFormats } from '../../../common/tooltip-fields';
import { METRIC_ARRAY_ATTRIBUTE } from '../../../common/metric-attribute';
import { notMetric } from '../metric-chart-schema';
import { validateDataSources, type DataSource } from '../../../common/data-sources';
import omit from 'lodash/omit';

const dataSources = [
	{ requires: ['data', 'x', 'y'], forbids: ['metric'] },
	{ requires: ['metric'], forbids: ['data', 'y'] }
] as const satisfies readonly DataSource[];

export const schema = {
	render: 'bar_chart',
	category: 'chart',
	description: 'Display a bar chart',
	keywords: ['column chart', 'bar graph', 'bar plot'],
	dataSources,
	validate: and(
		validateDataSources(dataSources),
		metricExists('metric'),
		ifCondition(
			notMetric,
			and(
				comboChartSchema.validate,
				validateSqlExpression('y', 'data', 'select'),
				validateSqlExpression('y2', 'data', 'select'),
				validateSqlExpression('tooltip_fields', 'data', 'select'),
				validateTooltipFieldFormats,
				axisHasAggregation('x', 'y', { getXFromParent: true }),
				validateValueAxisType('y', {
					categoryAxisAttribute: 'x',
					swappedAxesChartSuggestion: 'horizontal_bar_chart'
				}),
				validateStackedProp()
			)
		),
		validateEmptyAttributes()
	),
	attributes: {
		...comboChartSchema.attributes,
		...omit(barSchema.attributes, 'axis', 'stack_id', 'echarts_options'),
		...multiSeriesSchema.attributes,
		stacked: {
			type: [Boolean, String],
			required: false,
			default: true,
			description:
				'Whether to stack the bars. Set to "100%" for percentage stacking where each bar shows its proportion of the total.'
		},
		bar_options: barOptionsAttribute,
		// Metric mode (see line_chart): `metric` supplies data + y; relax required.
		...METRIC_ARRAY_ATTRIBUTE,
		// `required: false` lets `metric=` alone validate; `suggested: true` keeps
		// data/x/y in the slash-command scaffold (the raw-mode starting point).
		data: { ...comboChartSchema.attributes.data, required: false, suggested: true },
		x: { ...comboChartSchema.attributes.x, required: false, suggested: true },
		y: { ...multiSeriesSchema.attributes.y, required: false, suggested: true }
	},
	allowedChildren: ['reference_line', 'reference_area', 'reference_point'],
	componentWrapper: comboChartSchema.componentWrapper,
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% bar_chart
	data="demo.daily_orders"
	x="category"
	y="sum(total_sales)"
/%}
`
		},
		{
			title: 'Bar Chart with Date Grain',
			example: `
{% bar_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    date_grain="month"
/%}
`
		},
		{
			title: 'Sorting by Value',
			example: `
{% bar_chart
    data="demo.daily_orders"
    x="category"
    y="sum(total_sales)"
    order="sum(total_sales) desc"
/%}
`
		},
		{
			title: 'Custom Category Order',
			example: `
{% bar_chart
    data="demo.daily_orders"
    x="category"
    y="sum(total_sales)"
    x_sort=["Clothing", "Home", "Sports", "Electronics"]
/%}
`
		},
		{
			title: 'Bar Chart with Series Colors',
			example: `
{% bar_chart
    data="demo.daily_orders"
    x="category"
    y="sum(total_sales)"
    series="case when sum(total_sales) > 7000 then '>$7k' when sum(total_sales) > 3500 then '>$3.5k' else '<$3.5k' end"
    title="Sales by Category and Performance"
    chart_options={
        series_colors={
            ">$7k"="#22c55e"
            ">$3.5k"="#f59e0b"
            "<$3.5k"="#ef4444"
        }
    }
/%}
`
		},
		{
			title: '100% Stacked Bar Chart',
			example: `
{% bar_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    series="category"
    stacked="100%"
    date_grain="month"
    title="Sales Distribution by Category"
/%}
`
		},
		{
			title: 'Revenue by Day of Week',
			example: `
{% bar_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    y_fmt="usd"
    date_grain="day of week"
    title="Revenue by Day of Week"
    subtitle="Weekday vs weekend sales patterns"
/%}
`
		},
		{
			title: 'Seasonality Analysis (Month of Year)',
			example: `
{% bar_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    y_fmt="usd"
    date_grain="month of year"
    title="Seasonality Analysis"
    subtitle="Sales patterns across months"
/%}
`
		},
		{
			title: 'Quarterly Trends',
			example: `
{% bar_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    y_fmt="usd"
    date_grain="quarter of year"
    title="Quarterly Performance"
    subtitle="Q1 through Q4 comparison"
/%}
`
		},
		{
			title: 'Monthly Billing Cycle Patterns',
			example: `
{% bar_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    y_fmt="usd"
    date_grain="day of month"
    title="Daily Revenue by Day of Month"
    subtitle="Identify billing cycle patterns"
/%}
`
		},
		{
			title: 'Week Number Analysis',
			example: `
{% bar_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    y_fmt="usd"
    date_grain="week of year"
    title="Revenue by Week of Year"
    subtitle="Weekly performance across the year"
/%}
`
		},
		{
			title: 'Day of Year Analysis',
			example: `
{% bar_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    y_fmt="usd"
    date_grain="day of year"
    title="Revenue by Day of Year"
    subtitle="Identify patterns across 365 days"
/%}
`
		},
		{
			title: 'Extra tooltip fields',
			example: `
<!-- tooltip_fields adds extra rows to the tooltip on hover, using the same GROUP BY / filters / date range as the chart's primary y. color_by_sign paints positives green and negatives red; add down_is_good=true to flip that mapping. -->
{% bar_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    y_fmt="usd"
    date_grain="month"
    tooltip_fields=[
        { value="count(distinct order_id)" label="Orders" },
        { value="sum(total_sales) / nullif(count(distinct order_id), 0)" label="Avg order" fmt="usd" }
    ]
/%}
`
		},
		{
			title: 'Raw ECharts overrides (rounded bars, background track)',
			example: `
{% bar_chart
    data="demo.daily_orders"
    x="category"
    y="sum(total_sales)"
    echarts_series_options={
        itemStyle={ borderRadius=[6, 6, 0, 0] }
        showBackground=true
        backgroundStyle={ color="rgba(0,0,0,0.04)" }
    }
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
