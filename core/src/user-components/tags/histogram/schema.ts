import type { UserComponentSchema } from '../../types';
import { BooleanVariable } from '../../common/zod-attribute';
import { SQL_OPTIONS, REFRESH_INTERVAL_ATTRIBUTE } from '../../common/sql-options';
import {
	and,
	columnsExistInTable,
	filtersExist,
	tableExists,
	validateSqlExpression,
	validateInfoRequiresTitle,
	validateFormatCode,
	validateEmptyAttributes,
	validateVariablesInComponent
} from '../../validators';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { HEIGHT_ATTRIBUTE } from '../../common/height-attribute';
import { CONNECT_GROUP_ATTRIBUTE } from '../../common/connect-group-attribute';
import { ZodAttribute, NumberVariable } from '../../common/zod-attribute';
import { z } from 'zod';

import {
	ECHARTS_OPTIONS_ATTRIBUTE,
	ECHARTS_SERIES_OPTIONS_ATTRIBUTE
} from '../../common/echarts-options-attributes';

const attributes = {
	data: {
		type: String,
		required: true,
		description: 'Name of the table to query',
		suggestionType: 'table',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'text'
	},
	value: {
		type: String,
		required: true,
		description: 'SQL expression for the values to create histogram for',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	series: {
		type: String,
		required: false,
		description: 'Column name to group data by series',
		suggestionType: 'column',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	chart_options: {
		type: ZodAttribute.create(
			z.object({
				color_palette: z.array(z.string()).optional()
			})
		),
		required: false,
		default: {},
		description: 'Chart configuration options',
		affectsQuery: false
	},
	bin_count: {
		type: NumberVariable,
		required: false,
		default: 20,
		description: 'Number of bins for the histogram (takes precedence over bin_width)',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'text'
	},
	bin_width: {
		type: NumberVariable,
		required: false,
		description: 'Width of each bin (ignored if bin_count is specified)',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'text'
	},
	fmt: {
		type: String,
		required: false,
		description: 'Format for the column values displayed in bin ranges',
		affectsQuery: false,
		suggestionType: 'format'
	},
	filters: {
		type: Array,
		required: false,
		default: [],
		description: 'IDs of filters to apply to the query',
		suggestionType: 'filter',
		affectsQuery: true
	},

	title: {
		type: String,
		required: false,
		description: 'Title to display above the histogram',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	subtitle: {
		type: String,
		required: false,
		description: 'Subtitle to display below the title',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	info: {
		type: String,
		required: false,
		description:
			'Info text to display in a tooltip next to the title. Can only be used with the title prop.',
		affectsQuery: false,
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
	legend: {
		type: BooleanVariable,
		required: false,
		default: true,
		description: 'Show legend',
		affectsQuery: false,
		supportsVariables: true
	},
	legend_location: {
		type: ZodAttribute.create(z.enum(['top', 'bottom'])),
		required: false,
		default: 'top',
		description: 'Position of the legend (top or bottom)',
		affectsQuery: false
	},
	// Include only relevant SQL options for histogram
	...REFRESH_INTERVAL_ATTRIBUTE,
	where: SQL_OPTIONS.where,
	limit: SQL_OPTIONS.limit,
	...REFRESH_INTERVAL_ATTRIBUTE,
	...WIDTH_ATTRIBUTE,
	...HEIGHT_ATTRIBUTE,
	...CONNECT_GROUP_ATTRIBUTE,
	...ECHARTS_OPTIONS_ATTRIBUTE,
	...ECHARTS_SERIES_OPTIONS_ATTRIBUTE
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'histogram',
	category: 'chart',
	keywords: ['distribution', 'frequency chart', 'frequency distribution'],
	selfClosing: true,
	validate: and(
		tableExists('data'),
		columnsExistInTable('data', ['series']),
		filtersExist('filters'),
		validateSqlExpression('value', 'data', 'select'),
		validateInfoRequiresTitle,
		validateFormatCode('fmt'),
		validateEmptyAttributes(),
		validateVariablesInComponent()
	),
	description: 'Display a histogram chart showing the distribution of values in a column.',
	attributes,
	componentWrapper: {
		display: 'block',
		width: 'full',
		flex: {
			grow: 3,
			minWidth: 250,
			minHeight: 215
		}
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% histogram
    data="demo.daily_orders"
    value="transactions"
    bin_count=30
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
