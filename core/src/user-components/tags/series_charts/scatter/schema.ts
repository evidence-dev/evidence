import type { UserComponentSchema } from '../../../types';
import omit from 'lodash/omit';
import {
	schema as seriesSchema,
	seriesEchartsOptionsAttribute
} from '../combo_chart/series/schema';
import { and, validateEmptyAttributes } from '../../../validators';

export const schema = {
	render: 'scatter',
	category: 'chart_slot',
	selfClosing: true,
	description: 'Add a scatter series to a [combo_chart](/components/combo_chart)',
	attributes: {
		...omit(seriesSchema.attributes, 'type'),
		opacity: {
			type: Number,
			required: false,
			default: 0.7,
			description: 'The opacity of the series'
		},
		echarts_options: seriesEchartsOptionsAttribute
	},
	validate: and(seriesSchema.validate, validateEmptyAttributes()),
	allowedParents: ['combo_chart'],
	componentWrapper: seriesSchema.componentWrapper,
	examples: [
		{
			title: 'Basic Scatter Series',
			hero: true,
			example: `
{% combo_chart data="demo.daily_orders" x="date" date_grain="month" %}
    {% scatter y="sum(total_sales)" /%}
{% /combo_chart %}
`
		}
	]
} as const satisfies UserComponentSchema;
