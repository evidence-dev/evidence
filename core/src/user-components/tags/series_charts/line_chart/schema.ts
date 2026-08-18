import {
	and,
	validateSqlExpression,
	axisHasAggregation,
	validateEmptyAttributes,
	metricExists
} from '../../../validators';
import { ifCondition } from '../../../validators/ifCondition';
import type { UserComponentSchema } from '../../../types';
import { schema as comboChartSchema } from '../combo_chart/schema';
import { lineOptionsAttribute, schema as lineSchema } from '../line/schema';
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
	render: 'line_chart',
	category: 'chart',
	description: 'Display a line chart',
	keywords: ['line graph', 'line plot', 'time series', 'trend'],
	dataSources,
	validate: and(
		validateDataSources(dataSources),
		metricExists('metric'),
		// Raw-path validators only apply when not driven by `metric` (metric mode
		// has no `data`/`x`/`y` to validate against — the reference is checked by
		// `metricExists`, exactly like big_value).
		ifCondition(
			notMetric,
			and(
				comboChartSchema.validate,
				validateSqlExpression('y', 'data', 'select'),
				validateSqlExpression('y2', 'data', 'select'),
				validateSqlExpression('tooltip_fields', 'data', 'select'),
				validateTooltipFieldFormats,
				axisHasAggregation('x', 'y', { getXFromParent: true })
			)
		),
		validateEmptyAttributes()
	),
	attributes: {
		...comboChartSchema.attributes,
		...omit(lineSchema.attributes, 'axis', 'options', 'echarts_options'),
		...multiSeriesSchema.attributes,
		line_options: lineOptionsAttribute,
		// Metric mode: `metric` supplies data + y (+ default x/grain from the view).
		// Relax the raw-path required flags so `{% line_chart metric="revenue" /%}`
		// validates; `metricChartValidSource` enforces one path or the other.
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
{% line_chart
	data="demo.daily_orders"
	x="date"
	y="sum(total_sales)"
	date_grain="month"
/%}
`
		},
		{
			title: 'Semantic metric (time series)',
			example: `
{% line_chart metric="revenue" /%}
`
		},
		{
			title: 'Multiple metrics',
			example: `
{% line_chart metric=["revenue", "order_count"] /%}
`
		},
		{
			title: 'Line Chart with Series',
			example: `
{% line_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    series="category"
    date_grain="month"
/%}
`
		},
		{
			title: 'Line Chart with Formatting',
			example: `
{% line_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    y_fmt="usd"
    title="Sales Over Time"
    subtitle="Monthly sales performance"
    date_grain="month"
/%}
`
		},
		{
			title: 'Line Chart with Series Colors',
			example: `
{% line_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    series="case when sum(total_sales) > 7000 then 'High' when sum(total_sales) > 3500 then 'Medium' else 'Low' end"
    date_grain="month"
    title="Sales Performance Tiers"
    chart_options={
        series_colors={
            "High"="#22c55e"
            "Medium"="#f59e0b"
            "Low"="#ef4444"
        }
    }
/%}
`
		},
		{
			title: 'Revenue by Day of Week',
			example: `
{% line_chart
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
{% line_chart
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
{% line_chart
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
{% line_chart
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
{% line_chart
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
{% line_chart
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
			title: 'Raw ECharts overrides',
			example: `
{% line_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    date_grain="month"
    echarts_options={
        dataZoom=[{ type="slider" }]
        grid={ right=60 }
        tooltip={ position="top" }
    }
    echarts_series_options={
        endLabel={ show=true }
    }
/%}
`
		},
		{
			title: 'Styled markers via echarts_series_options',
			example: `
{% line_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    date_grain="month"
    echarts_series_options={
        symbol="circle"
        symbolSize=10
        itemStyle={
            opacity=1
            color="#ffffff"
            borderColor="#3b82f6"
            borderWidth=2
        }
    }
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
