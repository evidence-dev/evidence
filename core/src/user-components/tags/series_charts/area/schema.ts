import type { UserComponentSchema } from '../../../types';
import omit from 'lodash/omit';
import {
	schema as seriesSchema,
	seriesEchartsOptionsAttribute
} from '../combo_chart/series/schema';
import { ZodAttribute } from '../../../common/zod-attribute';
import { z } from 'zod';
import { and, validateEmptyAttributes, validateStackedProp } from '../../../validators';

export const areaOptionsAttribute = {
	type: ZodAttribute.create(
		z.object({
			step: z
				.enum(['start', 'middle', 'end'], {
					description:
						'Show a stepped line rather than a smooth line between points and control where the step happens (start, middle, or end)'
				})
				.optional(),
			smooth: z.boolean().optional(),
			gradient: z
				.boolean({
					description:
						'Apply a color-to-transparent gradient fill to the area, fading from the series color at the top to transparent at the bottom'
				})
				.optional()
		})
	)
};

export const schema = {
	render: 'area',
	category: 'chart_slot',
	selfClosing: true,
	description: 'Add an area series to a [combo_chart](/components/combo_chart)',
	attributes: {
		...omit(seriesSchema.attributes, 'type'),
		options: areaOptionsAttribute,
		echarts_options: seriesEchartsOptionsAttribute,
		stacked: {
			type: [Boolean, String],
			required: false,
			default: true,
			description:
				'Whether to stack areas with the same series value. Set to "100%" for percentage stacking.'
		},
		stack_id: {
			type: String,
			required: false,
			description:
				'Stack identifier - areas with the same stack_id value will be stacked together. Overrides the stacked prop.'
		}
	},
	validate: and(seriesSchema.validate, validateStackedProp(), validateEmptyAttributes()),
	allowedParents: ['combo_chart'],
	componentWrapper: seriesSchema.componentWrapper,
	examples: [
		{
			title: 'Basic Area Series',
			hero: true,
			example: `
{% combo_chart data="demo.daily_orders" x="date" date_grain="month" %}
    {% area y="sum(total_sales)" /%}
{% /combo_chart %}
`
		},
		{
			title: 'Unstacked Areas',
			example: `
{% combo_chart data="demo.daily_orders" x="date" date_grain="month" %}
    {% area y="sum(total_sales)" series="category" stacked=false /%}
{% /combo_chart %}
`
		},
		{
			title: 'Area with Gradient Fill',
			example: `
{% combo_chart data="demo.daily_orders" x="date" date_grain="month" %}
    {% area y="sum(total_sales)" stacked=false options={
        gradient=true
    } /%}
{% /combo_chart %}
`
		}
	]
} as const satisfies UserComponentSchema;
