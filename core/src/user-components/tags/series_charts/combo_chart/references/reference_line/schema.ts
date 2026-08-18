import { ZodAttribute } from '../../../../../common/zod-attribute';
import type { UserComponentSchema } from '../../../../../types';
import {
	and,
	validateSqlExpression,
	validateFormatCode,
	type Validator,
	validateEmptyAttributes
} from '../../../../../validators';
import { ifCondition } from '../../../../../validators/ifCondition';
import type { LineLabelOption } from 'echarts/types/src/util/types.js';
import z from 'zod';
import { isStringNotNumber } from '../isStringNotNumber.validator';
import { FMT_OPTIONS } from '../../../../../formatValue';

const REFERENCE_LINE_LABEL_POSITIONS = [
	'above_end',
	'above_start',
	'above_center',
	'below_end',
	'below_start',
	'below_center'
] as const;
type ReferenceLineLabelPosition = (typeof REFERENCE_LINE_LABEL_POSITIONS)[number];
const LABEL_POSITION_TRANSFORM: Record<ReferenceLineLabelPosition, LineLabelOption['position']> = {
	above_end: 'insideEndTop',
	above_start: 'insideStartTop',
	above_center: 'insideMiddleTop',
	below_end: 'insideEndBottom',
	below_start: 'insideStartBottom',
	below_center: 'insideMiddleBottom'
};

const referenceLineLabelOptionsSchema = z
	.object({
		position: z
			.enum(REFERENCE_LINE_LABEL_POSITIONS)
			.optional()
			.default('above_end')
			.transform((value) => LABEL_POSITION_TRANSFORM[value]),
		align: z.enum(['left', 'center', 'right']).optional(),
		color: z.string().optional(),
		background_color: z.string().optional(),
		padding: z.number().optional().default(1),
		fmt: z
			.union([
				z.enum(FMT_OPTIONS, {
					description: 'Format the label value. Defaults to series or axis fmt.'
				}),
				z.string()
			])
			.optional(),
		hide_value: z.boolean().default(false).optional(),
		border: z
			.object({
				width: z.number().optional().default(0),
				type: z.enum(['solid', 'dashed', 'dotted']).optional().default('solid'),
				color: z.string().optional(),
				radius: z.number().optional().default(1)
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
	.default({ border: {}, text: {} });

const referenceLineLineOptionsSchema = z
	.object({
		color: z.string().optional(),
		width: z.number({ description: 'Width of the line' }).positive().optional(),
		type: z.enum(['solid', 'dashed', 'dotted']).optional(),
		opacity: z.number({ description: 'Between 0 and 1' }).min(0).max(1).optional()
	})
	.optional()
	.default({});

const referenceLineSymbolOptionsSchema = z
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
	.optional()
	.default({ shape: 'none' });

const referenceLineSymbolsSchema = z
	.object({
		start: referenceLineSymbolOptionsSchema,
		end: referenceLineSymbolOptionsSchema
	})
	.optional()
	.default({ start: { shape: 'none' }, end: { shape: 'none' } });

const hasXOrYOrX1Y1X2Y2: Validator = (node) => {
	const hasX = typeof node.attributes.x !== 'undefined';
	const hasY = typeof node.attributes.y !== 'undefined';
	const hasX1Y1X2Y2 =
		typeof node.attributes.x1 !== 'undefined' &&
		typeof node.attributes.y1 !== 'undefined' &&
		typeof node.attributes.x2 !== 'undefined' &&
		typeof node.attributes.y2 !== 'undefined';

	const count = [hasX, hasY, hasX1Y1X2Y2].filter((bool) => bool).length;
	if (count !== 1) {
		return [
			{
				id: 'invalid-attributes',
				level: 'error',
				// prettier-ignore
				message:
`You must provide either:
\`x\` (vertical line)
\`y\` (horizontal line)
\`x1\`/\`y1\`/\`x2\`/\`y2\` (sloped line)`,
				location: node.location
			}
		];
	}

	return [];
};

export const schema = {
	render: 'reference_line',
	category: 'chart_slot',
	description: 'Add a reference line inside a chart',
	selfClosing: true,
	attributes: {
		data: {
			type: String,
			description: 'Query name to use for calculating dynamic reference values',
			suggestionType: 'table'
		},
		label: {
			type: String,
			description: 'Text label to display on the reference line',
			suggestionType: 'sql'
		},
		x: {
			type: [String, Number],
			description: 'X-axis value for a vertical reference line (e.g., a date or category)',
			suggestionType: 'sql'
		},
		y: {
			type: [String, Number],
			description: 'Y-axis value for a horizontal reference line (e.g., a target or threshold)',
			suggestionType: 'sql'
		},
		x1: {
			type: [String, Number],
			description: 'Starting x-coordinate for a sloped line',
			suggestionType: 'sql'
		},
		y1: {
			type: [String, Number],
			description: 'Starting y-coordinate for a sloped line',
			suggestionType: 'sql'
		},
		x2: {
			type: [String, Number],
			description: 'Ending x-coordinate for a sloped line',
			suggestionType: 'sql'
		},
		y2: {
			type: [String, Number],
			description: 'Ending y-coordinate for a sloped line',
			suggestionType: 'sql'
		},
		color: {
			type: String,
			description: 'Color of the reference line'
		},
		label_options: {
			type: ZodAttribute.create(referenceLineLabelOptionsSchema),
			description: 'Styling options for the label',
			default: {}
		},
		line_options: {
			type: ZodAttribute.create(referenceLineLineOptionsSchema),
			description: 'Styling options for the line itself',
			default: {}
		},
		symbols: {
			type: ZodAttribute.create(referenceLineSymbolsSchema),
			description: 'Symbol shapes to display at line endpoints',
			default: {}
		}
	},
	validate: and(
		hasXOrYOrX1Y1X2Y2,
		validateFormatCode('fmt'),
		ifCondition(
			(node) => typeof node.attributes.data !== 'undefined',
			and(
				validateSqlExpression('label', 'data', 'select'),
				isStringNotNumber('x'),
				validateSqlExpression('x', 'data', 'select'),
				isStringNotNumber('y'),
				validateSqlExpression('y', 'data', 'select'),
				isStringNotNumber('x1'),
				validateSqlExpression('x1', 'data', 'select'),
				isStringNotNumber('y1'),
				validateSqlExpression('y1', 'data', 'select'),
				isStringNotNumber('x2'),
				validateSqlExpression('x2', 'data', 'select'),
				isStringNotNumber('y2'),
				validateSqlExpression('y2', 'data', 'select'),
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
			title: 'Horizontal Target Line',
			hero: true,
			example: `{% line_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    date_grain="month"
%}
    {% reference_line 
        y=3500000 
        label="Target" 
        color="red" 
    /%}
{% /line_chart %}`
		},
		{
			title: 'Vertical Line at Date',
			example: `{% line_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    date_grain="month"
%}
    {% reference_line 
        x="2021-06-01" 
        label="Product Launch" 
        color="green" 
    /%}
{% /line_chart %}`
		},
		{
			title: 'Reference Lines from Data',
			example: `\`\`\`sql ref_lines
select 2500000 as ref, 'Min Target' as ref_label
union all
select 4000000, 'Stretch Goal'
\`\`\`

{% bar_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    date_grain="month"
%}
    {% reference_line 
        data="ref_lines" 
        y="ref" 
        label="ref_label" 
    /%}
{% /bar_chart %}`
		},
		{
			title: 'Custom Label Styling',
			example: `{% line_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    date_grain="month"
%}
    {% reference_line 
        y=3000000 
        label="Threshold" 
        color="orange"
        label_options={
            position="above_start"
            background_color="orange"
            color="white"
            padding=4
        }
        line_options={
            type="dashed"
            width=2
        }
    /%}
{% /line_chart %}`
		},
		{
			title: 'Multiple Reference Lines',
			example: `{% line_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    date_grain="month"
%}
    {% reference_line y=2500000 label="Min Target" color="red" /%}
    {% reference_line y=4500000 label="Stretch Goal" color="green" /%}
{% /line_chart %}`
		}
	]
} as const satisfies UserComponentSchema;
