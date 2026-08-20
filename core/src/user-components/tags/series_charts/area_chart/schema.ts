import type { UserComponentSchema } from '../../../types';
import { schema as comboChartSchema } from '../combo_chart/schema';
import { areaOptionsAttribute, schema as areaSchema } from '../area/schema';
import {
	and,
	validateSqlExpression,
	axisHasAggregation,
	validateEmptyAttributes,
	validateStackedProp,
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
	render: 'area_chart',
	category: 'chart',
	description: 'Display an area chart',
	keywords: ['area graph', 'area plot', 'stacked area'],
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
				validateStackedProp()
			)
		),
		validateEmptyAttributes()
	),
	attributes: {
		...comboChartSchema.attributes,
		...omit(areaSchema.attributes, 'axis', 'stack_id', 'echarts_options'),
		...multiSeriesSchema.attributes,
		stacked: {
			type: [Boolean, String],
			required: false,
			default: true,
			description:
				'Whether to stack the areas. Set to "100%" for percentage stacking where each area shows its proportion of the total.'
		},
		area_options: areaOptionsAttribute,
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
{% area_chart
	data="demo.daily_orders"
	x="date"
	y="sum(total_sales)"
	date_grain="month"
/%}
`
		},
		{
			title: 'Area Chart with Series',
			example: `
{% area_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    series="category"
    date_grain="month"
/%}
`
		},
		{
			title: 'Area Chart with Formatting',
			example: `
{% area_chart
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
			title: '100% Stacked Area Chart',
			example: `
{% area_chart
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
{% area_chart
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
{% area_chart
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
{% area_chart
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
{% area_chart
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
{% area_chart
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
{% area_chart
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
			title: 'Area Chart with Gradient Fill',
			example: `
{% area_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    y_fmt="usd"
    date_grain="month"
    stacked=false
    area_options={
        gradient=true
    }
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
