import type { UserComponentSchema } from '../../../types';
import omit from 'lodash/omit';
import {
	schema as seriesSchema,
	seriesEchartsOptionsAttribute
} from '../combo_chart/series/schema';
import { and, validateEmptyAttributes } from '../../../validators';

export const schema = {
	render: 'bubble',
	category: 'chart_slot',
	selfClosing: true,
	description: 'Add a bubble series to a [combo_chart](/components/combo_chart)',
	attributes: {
		...omit(seriesSchema.attributes, 'type'),
		opacity: {
			type: Number,
			required: false,
			default: 0.7,
			description: 'The opacity of the series'
		},
		size: {
			type: String,
			required: true,
			description: 'Column to use for the size of the bubbles',
			suggestionType: 'sql',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'column'
		},
		echarts_options: seriesEchartsOptionsAttribute
	},
	validate: and(seriesSchema.validate, validateEmptyAttributes()),
	allowedParents: ['combo_chart'],
	componentWrapper: seriesSchema.componentWrapper,
	examples: [
		{
			title: 'Basic Bubble Series',
			hero: true,
			example: `
{% combo_chart data="demo.daily_orders" x="date" date_grain="month" %}
    {% bubble
        y="avg(avg_transaction_value)"
        size="sum(transactions)"
    /%}
{% /combo_chart %}
`
		}
	]
} as const satisfies UserComponentSchema;
