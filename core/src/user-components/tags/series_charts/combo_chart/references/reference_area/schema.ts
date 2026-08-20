import { ZodAttribute } from '../../../../../common/zod-attribute';
import { SQL_OPTIONS } from '../../../../../common/sql-options';
import type { UserComponentSchema } from '../../../../../types';
import {
	and,
	filtersExist,
	validateSqlExpression,
	type Validator,
	validateEmptyAttributes
} from '../../../../../validators';
import { ifCondition } from '../../../../../validators/ifCondition';
import { requiresData } from '../requiresData.validator';
import z from 'zod';
import { isStringNotNumber } from '../isStringNotNumber.validator';
import type { LabelOption } from 'echarts/types/src/util/types.js';

const REFERENCE_LINE_LABEL_POSITIONS = [
	'top_left',
	'top',
	'top_right',
	'bottom_left',
	'bottom',
	'bottom_right',
	'left',
	'center',
	'right'
] as const;
type ReferenceLineLabelPosition = (typeof REFERENCE_LINE_LABEL_POSITIONS)[number];
const LABEL_POSITION_TRANSFORM: Record<ReferenceLineLabelPosition, LabelOption['position']> = {
	top_left: 'insideTopLeft',
	top: 'insideTop',
	top_right: 'insideTopRight',
	bottom_left: 'insideBottomLeft',
	bottom: 'insideBottom',
	bottom_right: 'insideBottomRight',
	left: 'insideLeft',
	center: 'inside',
	right: 'insideRight'
};

const referenceAreaLabelOptionsSchema = z
	.object({
		position: z
			.enum(REFERENCE_LINE_LABEL_POSITIONS)
			.optional()
			.default('top')
			.transform((value) => LABEL_POSITION_TRANSFORM[value]),
		align: z.enum(['left', 'center', 'right']).optional(),
		color: z.string().optional(),
		background_color: z.string().optional(),
		padding: z.number().optional().default(1),
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

const referenceAreaAreaOptionsSchema = z
	.object({
		color: z.string().optional(),
		opacity: z.number().min(0).max(1).optional().default(1),
		border: z
			.object({
				width: z.number().optional().default(0),
				type: z.enum(['solid', 'dashed', 'dotted']).optional().default('solid'),
				color: z.string().optional()
			})
			.optional()
			.default({})
	})
	.default({ border: {} });

const hasAtLeastOneOfXMinOrXMaxOrYMinOrYMax: Validator = (node) => {
	const hasXMin = typeof node.attributes.x_min !== 'undefined';
	const hasXMax = typeof node.attributes.x_max !== 'undefined';
	const hasYMin = typeof node.attributes.y_min !== 'undefined';
	const hasYMax = typeof node.attributes.y_max !== 'undefined';

	if (hasXMin || hasXMax || hasYMin || hasYMax) return [];

	return [
		{
			id: 'invalid-attributes',
			level: 'error',
			message: `You must provide at least one of \`x_min\`, \`x_max\`, \`y_min\`, or \`y_max\``,
			location: node.location
		}
	];
};

export const schema = {
	render: 'reference_area',
	category: 'chart_slot',
	description: 'Add a reference area inside a chart',
	selfClosing: true,
	attributes: {
		data: {
			type: String,
			description: 'Query name to use for calculating dynamic area boundaries',
			suggestionType: 'table'
		},
		filters: {
			type: Array,
			required: false,
			default: [],
			description: 'IDs of filters to apply to the query (requires `data`)',
			suggestionType: 'filter',
			affectsQuery: true
		},
		where: SQL_OPTIONS.where,
		label: {
			type: String,
			description: 'Text label to display in the reference area',
			suggestionType: 'sql'
		},
		x_min: {
			type: [String, Number],
			description: 'Left boundary of the area (e.g., a start date)',
			suggestionType: 'sql'
		},
		x_max: {
			type: [String, Number],
			description: 'Right boundary of the area (e.g., an end date)',
			suggestionType: 'sql'
		},
		y_min: {
			type: [String, Number],
			description: 'Bottom boundary of the area (e.g., a minimum value)',
			suggestionType: 'sql'
		},
		y_max: {
			type: [String, Number],
			description: 'Top boundary of the area (e.g., a maximum value)',
			suggestionType: 'sql'
		},
		color: {
			type: String,
			description: 'Fill color of the reference area',
			default: '#0284c7'
		},
		label_options: {
			type: ZodAttribute.create(referenceAreaLabelOptionsSchema),
			description: 'Styling options for the label',
			default: {}
		},
		area_options: {
			type: ZodAttribute.create(referenceAreaAreaOptionsSchema),
			description: 'Styling options for the area fill and border',
			default: {}
		}
	},
	validate: and(
		hasAtLeastOneOfXMinOrXMaxOrYMinOrYMax,
		filtersExist('filters'),
		requiresData('filters', 'where'),
		ifCondition(
			(node) => typeof node.attributes.data !== 'undefined',
			and(
				validateSqlExpression('where', 'data', 'where'),
				validateSqlExpression('label', 'data', 'select'),
				isStringNotNumber('x_min'),
				validateSqlExpression('x_min', 'data', 'select'),
				isStringNotNumber('x_max'),
				validateSqlExpression('x_max', 'data', 'select'),
				isStringNotNumber('y_min'),
				validateSqlExpression('y_min', 'data', 'select'),
				isStringNotNumber('y_max'),
				validateSqlExpression('y_max', 'data', 'select'),
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
			title: 'Highlight Date Range',
			hero: true,
			example: `{% line_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    date_grain="month"
%}
    {% reference_area 
        x_min="2023-11-01" 
        x_max="2024-02-01" 
        label="Peak Season"
        color="green"
    /%}
{% /line_chart %}`
		},
		{
			title: 'Horizontal Value Band',
			example: `{% line_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    date_grain="month"
%}
    {% reference_area 
        y_min=2500000 
        y_max=4000000 
        label="Target Range"
        color="blue"
    /%}
{% /line_chart %}`
		},
		{
			title: 'Areas from Data',
			example: `\`\`\`sql seasons
select '2021-01-01' as start_date, '2021-03-31' as end_date, 'Q1' as quarter
union all
select '2021-04-01', '2021-06-30', 'Q2'
union all
select '2021-07-01', '2021-09-30', 'Q3'
union all
select '2021-10-01', '2021-12-31', 'Q4'
\`\`\`

{% bar_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    date_grain="month"
%}
    {% reference_area 
        data="seasons"
        x_min="start_date" 
        x_max="end_date" 
        label="quarter"
    /%}
{% /bar_chart %}`
		},
		{
			title: 'Custom Styling',
			example: `{% line_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    date_grain="month"
%}
    {% reference_area 
        y_min=3000000 
        y_max=4500000 
        label="Goal Zone"
        color="green"
        area_options={ 
            border={ width=2 type="dashed" color="green" }
        }
        label_options={
            position="top_right"
            color="green"
        }
    /%}
{% /line_chart %}`
		}
	]
} as const satisfies UserComponentSchema;
