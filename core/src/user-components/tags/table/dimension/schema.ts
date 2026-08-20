import type { UserComponentSchema } from '../../../types';
import { ZodAttribute, BooleanVariable } from '../../../common/zod-attribute';
import { z } from 'zod';
import {
	and,
	validateSqlExpression,
	needsDateGrain,
	validateFormatCode,
	validateEmptyAttributes,
	validateVariablesInComponent
} from '../../../validators';
import { DATE_GRAIN_ATTRIBUTE } from '../../../common/date-options';

export const imageOptionsSchema = z.object({
	height: z
		.number({
			description: 'Height of the image in pixels'
		})
		.optional(),
	width: z
		.number({
			description: 'Width of the image in pixels'
		})
		.optional(),
	alt: z
		.string({
			description: 'Alt text for the image'
		})
		.optional(),
	hide_label: z
		.boolean({
			description: 'Whether to hide the text label and show only the image'
		})
		.optional()
		.default(false)
});

export const logoOptionsSchema = z.object({
	size: z
		.enum(['sm', 'base', 'lg', 'xl'], {
			description: 'Logo size: sm, base, lg, xl'
		})
		.optional()
		.default('base'),
	grayscale: z
		.boolean({
			description: 'Display logo in grayscale'
		})
		.optional()
		.default(false),
	hide_label: z
		.boolean({
			description: 'Whether to hide the text label and show only the logo'
		})
		.optional()
		.default(false)
});

const attributes = {
	value: {
		type: String,
		required: true,
		affectsQuery: true,
		suggestionType: 'sql',
		supportsVariables: true,
		variableContext: 'column'
	},
	title: {
		type: String,
		required: false,
		default: undefined,
		supportsVariables: true,
		variableContext: 'text'
	},
	align: {
		type: String,
		required: false,
		matches: ['left', 'center', 'right'],
		default: undefined
	},
	wrap: {
		type: Boolean,
		required: false,
		default: undefined,
		description: 'Whether to allow content in this dimension column to wrap across multiple lines'
	},
	info: {
		type: String,
		required: false,
		default: undefined,
		supportsVariables: true,
		variableContext: 'text'
	},
	info_link: {
		type: String,
		required: false,
		description: 'URL to link the info text to (can only be used with info)',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	info_link_title: {
		type: String,
		required: false,
		description:
			'Create a custom link title for the info link, placed after the info text (can only be used with info_link)',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	hide: {
		type: BooleanVariable,
		required: false,
		default: false,
		description:
			'Whether to hide this column from the table display. Hidden columns are still included in queries and can be referenced by other columns.',
		supportsVariables: true,
		variableContext: 'text'
	},
	html: {
		type: Boolean,
		required: false,
		default: false,
		description: 'Whether to render the dimension value as HTML'
	},
	image_options: {
		type: ZodAttribute.create(imageOptionsSchema),
		required: false,
		default: undefined,
		description: 'Image display options (used when image prop is set)'
	},
	image: {
		type: String,
		required: false,
		default: undefined,
		description: 'Column name or SQL expression containing the image URL for this dimension',
		supportsVariables: true,
		variableContext: 'column'
	},
	logo: {
		type: String,
		required: false,
		default: undefined,
		description:
			'Column name or SQL expression containing the domain to look up a company logo for this dimension',
		supportsVariables: true,
		variableContext: 'column'
	},
	logo_options: {
		type: ZodAttribute.create(logoOptionsSchema),
		required: false,
		default: undefined,
		description: 'Logo display options (used when logo prop is set)'
	},
	link: {
		type: String,
		required: false,
		default: undefined,
		description: 'Column name or SQL expression containing the URL for linking this dimension',
		supportsVariables: true,
		variableContext: 'column'
	},
	link_label: {
		type: String,
		required: false,
		default: undefined,
		description: 'Static text to use as the link label instead of the cell content',
		supportsVariables: true,
		variableContext: 'text'
	},
	link_new_tab: {
		type: Boolean,
		required: false,
		default: false,
		description: 'Whether to open the link in a new tab'
	},
	...DATE_GRAIN_ATTRIBUTE,
	fmt: {
		type: String,
		required: false,
		default: undefined,
		description:
			'Format code for displaying dimension values (e.g., "yyyy" for years, "mmm" for months)',
		supportsVariables: true,
		variableContext: 'text'
	},
	sort: {
		type: String,
		required: false,
		matches: ['asc', 'desc'],
		default: undefined,
		description:
			'Sort direction for this dimension column. When specified, the table will be sorted by this column.'
	},
	column_group: {
		type: String,
		required: false,
		default: undefined,
		description:
			'Group name for this column. Columns with matching group names will be visually grouped under a shared header.'
	},
	repeat_values: {
		type: Boolean,
		required: false,
		default: undefined,
		description:
			'Whether to repeat this dimension value on every row. When true, the value is displayed on every row even when it is the same as the row above. Overrides the table-level repeat_values setting for this dimension.'
	},
	conditional_colors: {
		type: String,
		required: false,
		default: undefined,
		description:
			'SQL expression that returns color values for each row. Used to conditionally color dimension cells based on data (e.g., "case when count(*) > 0 then \'#22c55e\' else null end").',
		affectsQuery: true,
		suggestionType: 'sql',
		supportsVariables: true,
		variableContext: 'column'
	}
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'dimension',
	category: 'table',
	description:
		'Add a dimension to a table, including date filtering, date grains, formatting, and more',
	selfClosing: true,
	attributes,
	allowedParents: ['table'],
	componentWrapper: false,
	validate: and(
		validateSqlExpression('value', 'data', 'select', { getTableNameFromParent: true }),
		validateSqlExpression('conditional_colors', 'data', 'select', {
			getTableNameFromParent: true
		}),
		needsDateGrain('value'),
		validateFormatCode('fmt'),
		validateEmptyAttributes(),
		validateVariablesInComponent()
	),
	examples: [
		{
			title: 'Table with Dimensions',
			hero: true,
			example: `
{% table data="demo.daily_orders" %}
    {% dimension value="category" /%}
    {% dimension value="date" date_grain="month" title="Month" /%}
{% /table %}
`
		},
		{
			title: 'With Image',
			example: `
{% table data="demo.daily_orders" %}
    {% dimension value="category" image="image_url" /%}
    {% measure value="sum(total_sales)" /%}
{% /table %}
`
		},
		{
			title: 'With Link',
			example: `
{% table data="demo.daily_orders" %}
    {% dimension value="category" link="concat('https://www.google.com/search?q=', category)" /%}
    {% measure value="sum(total_sales)" /%}
{% /table %}
`
		},
		{
			title: 'With Logo',
			example: `
{% table data="sales" %}
    {% dimension value="vendor" logo="domain" /%}
    {% measure value="sum(amount)" /%}
{% /table %}
`
		},
		{
			title: 'Conditional Colors',
			example: `
{% table data="demo.daily_orders" %}
    {% dimension value="category" conditional_colors="case when sum(total_sales) > 20000000 then '#22c55e' when sum(total_sales) > 10000000 then '#f59e0b' else '#ef4444' end" /%}
    {% measure value="sum(total_sales)" fmt="usd1m" /%}
{% /table %}
`
		}
	]
} as const satisfies UserComponentSchema;
