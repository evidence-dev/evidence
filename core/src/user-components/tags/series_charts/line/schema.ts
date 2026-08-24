import type { UserComponentAttribute, UserComponentSchema } from '../../../types';
import omit from 'lodash/omit';
import {
	schema as seriesSchema,
	seriesEchartsOptionsAttribute
} from '../combo_chart/series/schema';
import { ZodAttribute } from '../../../common/zod-attribute';
import { z } from 'zod';
import { and, validateEmptyAttributes } from '../../../validators';

export const lineOptionsAttribute = {
	type: ZodAttribute.create(
		z.object({
			color: z.string().optional(),
			width: z.number({ description: 'Width of the line' }).positive().optional(),
			type: z.enum(['solid', 'dashed', 'dotted']).optional(),
			opacity: z.number({ description: 'Between 0 and 1' }).min(0).max(1).optional(),
			markers: z
				.object({
					shape: z.union([
						z.enum([
							'circle',
							'emptyCircle',
							'rect',
							'roundRect',
							'triangle',
							'diamond',
							'pin',
							'arrow',
							'none',
							'image://',
							'path://'
						]),
						z.string({ description: 'Custom image URL' }).startsWith('image://'),
						z.string({ description: 'Custom SVG path' }).startsWith('path://')
					]),
					size: z.number().optional().default(8)
				})
				.optional(),
			step: z
				.enum(['start', 'middle', 'end'], {
					description:
						'Show a stepped line rather than a smooth line between points and control where the step happens (start, middle, or end)'
				})
				.optional(),
			smooth: z.boolean().optional()
		})
	),
	default: {}
} as const satisfies UserComponentAttribute;

export const schema = {
	render: 'line',
	category: 'chart_slot',
	selfClosing: true,
	description: 'Add a line series to a [combo_chart](/components/combo_chart)',
	attributes: {
		...omit(seriesSchema.attributes, 'type'),
		options: lineOptionsAttribute,
		echarts_options: seriesEchartsOptionsAttribute
	},
	validate: and(seriesSchema.validate, validateEmptyAttributes()),
	allowedParents: ['combo_chart'],
	componentWrapper: seriesSchema.componentWrapper,
	examples: [
		{
			title: 'Basic Line Series',
			hero: true,
			example: `
{% combo_chart data="demo.daily_orders" x="date" date_grain="month" %}
    {% line y="sum(total_sales)" /%}
{% /combo_chart %}
`
		},
		{
			title: 'Styled Line',
			example: `
{% combo_chart data="demo.daily_orders" x="date" date_grain="month" %}
    {% line y="sum(total_sales)" options={type="dashed" width=2 markers={shape="circle"}} /%}
{% /combo_chart %}
`
		},
		{
			title: 'Raw ECharts overrides on a single series',
			example: `
{% combo_chart data="demo.daily_orders" x="date" date_grain="month" %}
    {% line
        y="sum(total_sales)"
        echarts_options={
            endLabel={ show=true }
            markPoint={ data=[{ type="max" }, { type="min" }] }
        }
    /%}
{% /combo_chart %}
`
		}
	]
} as const satisfies UserComponentSchema;
