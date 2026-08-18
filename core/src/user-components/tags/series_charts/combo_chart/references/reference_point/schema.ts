import { ZodAttribute } from '../../../../../common/zod-attribute';
import { FMT_OPTIONS } from '../../../../../formatValue';
import type { UserComponentSchema } from '../../../../../types';
import {
	and,
	validateSqlExpression,
	validateFormatCode,
	validateEmptyAttributes
} from '../../../../../validators';
import { ifCondition } from '../../../../../validators/ifCondition';
import defaultsDeep from 'lodash/defaultsDeep';
import z from 'zod';

const REFERENCE_POINT_LABEL_POSITIONS = ['top', 'right', 'bottom', 'left'] as const;

const referencePointLabelOptionsSchema_withoutDefaults = z
	.object({
		variant: z.enum(['default', 'callout']).optional().default('default'),
		position: z.enum(REFERENCE_POINT_LABEL_POSITIONS).optional().default('top'),
		align: z.enum(['left', 'center', 'right']).optional(),
		width: z.number().optional(),
		color: z.string().optional(),
		background_color: z.string().optional(),
		padding: z.number().optional(),
		fmt: z
			.union([
				z.enum(FMT_OPTIONS, {
					description: 'Format the label value. Defaults to series or axis fmt.'
				}),
				z.string()
			])
			.optional(),
		border: z
			.object({
				width: z.number().optional(),
				type: z.enum(['solid', 'dashed', 'dotted']).optional().default('solid'),
				color: z.string().optional(),
				radius: z.number().optional()
			})
			.optional()
			.default({}),
		text: z
			.object({
				size: z.number().optional().default(12),
				bold: z.boolean().optional().default(false),
				italic: z.boolean().optional().default(false)
			})
			.optional()
			.default({})
	})
	.default({ border: {}, text: {} })
	.transform(
		(value) => defaultsDeep({}, value, defaultLabelOptionsByVariant[value.variant]) as typeof value
	);

// Defaults for fields that have different default behavior depending on variant
// Doesn't include defaults for colors that require access to userTheme - those are applied in ReferencePointStaticModel
const defaultLabelOptionsByVariant = {
	default: {
		padding: 1,
		border: {
			width: 0,
			radius: 1
		},
		text: {
			size: 12,
			bold: false,
			italic: false
		}
	},
	callout: {
		padding: 8,
		border: {
			width: 1,
			radius: 4
		}
	}
} as const;

const referencePointSymbolOptionsSchema = z
	.object({
		shape: z
			.union([
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
			])
			.default('circle'),
		size: z.number().optional().default(8),
		color: z.string().optional()
	})
	.optional()
	.default({});

export const schema = {
	render: 'reference_point',
	category: 'chart_slot',
	description: 'Add a reference point inside a chart',
	selfClosing: true,
	attributes: {
		data: {
			type: String,
			description: 'Query name to use for placing multiple points from data',
			suggestionType: 'table'
		},
		label: {
			type: String,
			description: 'Text label to display at the reference point',
			suggestionType: 'sql'
		},
		color: {
			type: String,
			description: 'Color of the point marker'
		},
		x: {
			type: [String, Number],
			description: 'X-axis position of the point (e.g., a date or category)',
			suggestionType: 'sql',
			required: true
		},
		y: {
			type: [String, Number],
			description: 'Y-axis position of the point (e.g., a value)',
			suggestionType: 'sql',
			required: true
		},
		label_options: {
			type: ZodAttribute.create(referencePointLabelOptionsSchema_withoutDefaults),
			description: 'Styling options for the label',
			default: {}
		},
		symbol_options: {
			type: ZodAttribute.create(referencePointSymbolOptionsSchema),
			description: 'Styling options for the point marker',
			default: {}
		}
	},
	validate: and(
		validateFormatCode('fmt'),
		ifCondition(
			(node) => typeof node.attributes.data !== 'undefined',
			and(
				validateSqlExpression('x', 'data', 'select'),
				validateSqlExpression('y', 'data', 'select'),
				validateEmptyAttributes()
			)
		)
	),
	allowedParents: [
		'area_chart',
		'bar_chart',
		'bubble_chart',
		'combo_chart',
		'horizontal_bar_chart',
		'line_chart',
		'scatter_chart'
	],
	componentWrapper: false,
	examples: [
		{
			title: 'Hardcoded Point',
			hero: true,
			example: `{% line_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    date_grain="month"
%}
    {% reference_point
        x="2024-12-01"
        y=4441307
        label="Peak Month"
        color="green"
        label_options={
            position="left"
        }
    /%}
{% /line_chart %}`
		},
		{
			title: 'Point from Data',
			example: `\`\`\`sql top_months
select 
    toStartOfMonth(date) as month,
    sum(total_sales) as sales,
    'Top ' || row_number() over (order by sum(total_sales) desc) as label
from demo.daily_orders
group by month
order by sales desc
limit 3
\`\`\`

{% line_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    date_grain="month"
%}
    {% reference_point 
        data="top_months"
        x="month" 
        y="sales" 
        label="label"
        color="purple"
    /%}
{% /line_chart %}`
		},
		{
			title: 'Callout Style',
			example: `{% line_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    date_grain="month"
%}
    {% reference_point 
        x="2021-02-01" 
        y=1754436 
        label="Lowest Month"
        color="red"
        label_options={
            variant="callout"
            position="top"
        }
    /%}
{% /line_chart %}`
		},
		{
			title: 'Custom Symbol',
			example: `{% line_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    date_grain="month"
%}
    {% reference_point 
        x="2023-12-01" 
        y=3720260 
        label="Record High"
        symbol_options={
            shape="diamond"
            size=12
            color="gold"
        }
        label_options={
            position="right"
            color="orange"
        }
    /%}
{% /line_chart %}`
		}
	]
} as const satisfies UserComponentSchema;
