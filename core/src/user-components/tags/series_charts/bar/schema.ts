import type { UserComponentAttribute, UserComponentSchema } from '../../../types';
import omit from 'lodash/omit';
import {
	schema as seriesSchema,
	seriesEchartsOptionsAttribute
} from '../combo_chart/series/schema';
import { ZodAttribute } from '../../../common/zod-attribute';
import { z } from 'zod';
import { and, validateEmptyAttributes, validateStackedProp } from '../../../validators';

export const barOptionsAttribute = {
	type: ZodAttribute.create(
		z.object({
			color: z.string().optional(),
			opacity: z.number({ description: 'Between 0 and 1' }).min(0).max(1).optional()
		})
	),
	affectsQuery: false
} as const satisfies UserComponentAttribute;

export const schema = {
	render: 'bar',
	category: 'chart_slot',
	selfClosing: true,
	description: 'Add a bar series to a [combo_chart](/components/combo_chart)',
	attributes: {
		...omit(seriesSchema.attributes, 'type'),
		options: barOptionsAttribute,
		echarts_options: seriesEchartsOptionsAttribute,
		stacked: {
			type: [Boolean, String],
			required: false,
			default: true,
			description:
				'Whether to stack bars with the same series value. Set to "100%" for percentage stacking.'
		},
		stack_id: {
			type: String,
			required: false,
			description:
				'Stack identifier - bars with the same stack_id value will be stacked together. Overrides the stacked prop.'
		}
	},
	validate: and(seriesSchema.validate, validateStackedProp(), validateEmptyAttributes()),
	allowedParents: ['combo_chart'],
	componentWrapper: seriesSchema.componentWrapper,
	examples: [
		{
			title: 'Basic Bar Series',
			hero: true,
			example: `
{% combo_chart data="demo.daily_orders" x="date" date_grain="month" %}
    {% bar y="sum(total_sales)" /%}
{% /combo_chart %}
`
		},
		{
			title: 'Unstacked Bars',
			example: `
{% combo_chart data="demo.daily_orders" x="date" date_grain="month" %}
    {% bar y="sum(total_sales)" series="category" stacked=false /%}
{% /combo_chart %}
`
		},
		{
			title: 'Multiple Stacks',
			example: `
{% combo_chart data="demo.daily_orders" x="date" date_grain="month" %}
    {% bar y="sum(total_sales)" stack_id="sales" /%}
    {% bar y="sum(total_sales)+1000000" stack_id="sales" /%}
    {% bar y="sum(quantity)" stack_id="quantity" /%}
{% /combo_chart %}
`
		},
		{
			title: 'Extra tooltip fields',
			example: `
<!-- tooltip_fields adds extra rows to this series' tooltip on hover, using the same GROUP BY / filters / date range as the primary y. color_by_sign paints positives green and negatives red; down_is_good flips that mapping. -->
{% combo_chart data="demo.daily_orders" x="date" date_grain="month" %}
    {% bar
        y="sum(total_sales)"
        fmt="usd"
        tooltip_fields=[
            { value="count(distinct order_id)", label="Orders" },
            { value="sum(total_sales) - lag(sum(total_sales)) over (order by date_trunc('month', date))", label="MoM Δ", fmt="usd", color_by_sign=true }
        ]
    /%}
{% /combo_chart %}
`
		}
	]
} as const satisfies UserComponentSchema;
