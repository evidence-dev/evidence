import { SQL_OPTIONS, REFRESH_INTERVAL_ATTRIBUTE } from '../../common/sql-options';

// The image query is a row lookup with no GROUP BY, so `having` has nothing to act on.
const { having: _having, ...IMAGE_SQL_OPTIONS } = SQL_OPTIONS;
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import type { UserComponentSchema } from '../../types';
import {
	and,
	tableExists,
	filtersExist,
	columnsExistInTable,
	validateImageSource,
	validateSqlOptions,
	validateEmptyAttributes,
	validateVariablesInComponent
} from '../../validators';

export const schema = {
	render: 'image',
	category: 'ui',
	description:
		'Display an image from a URL or from a data query, or paste an image directly into the editor to upload and insert an image tag automatically.',
	selfClosing: true,
	validate: and(
		validateImageSource(),
		tableExists('data'),
		filtersExist('filters'),
		columnsExistInTable('data', ['column', 'dark_column', 'description_column']),
		validateSqlOptions(),
		validateEmptyAttributes(),
		validateVariablesInComponent()
	),
	attributes: {
		url: {
			type: String,
			required: false,
			description: 'The URL of the image. Required unless data is provided.',
			supportsVariables: true,
			variableContext: 'text'
		},
		dark_url: {
			type: String,
			required: false,
			description: 'The URL of the image to show in dark mode',
			supportsVariables: true,
			variableContext: 'text'
		},
		description: {
			type: String,
			required: false,
			description:
				'Description of the image, used as alt text. Required unless description_column is provided.',
			supportsVariables: true,
			variableContext: 'text'
		},
		data: {
			type: String,
			required: false,
			suggestionType: 'table',
			description:
				'Table or query to load the image URL from; the image updates when applied filters change',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'text'
		},
		column: {
			type: String,
			required: false,
			suggestionType: 'column',
			description:
				'Column containing the image URL; the first row of the query result is displayed',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'column'
		},
		dark_column: {
			type: String,
			required: false,
			suggestionType: 'column',
			description: 'Column containing the image URL to show in dark mode',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'column'
		},
		description_column: {
			type: String,
			required: false,
			suggestionType: 'column',
			description: 'Column containing the image description, used as alt text',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'column'
		},
		filters: {
			type: Array,
			required: false,
			description: 'IDs of filters to apply to the query',
			suggestionType: 'filter'
		},
		max_width: {
			type: Number,
			required: false,
			description: 'Maximum width of the image in pixels'
		},
		border: {
			type: Boolean,
			required: false,
			default: false,
			description: 'Whether to show a border around the image'
		},
		dither: {
			type: Boolean,
			required: false,
			default: false,
			description: 'Whether to apply dither effect to the image'
		},
		align: {
			type: String,
			required: false,
			matches: ['left', 'right', 'center'],
			default: 'center',
			description: 'Alignment of the image'
		},
		class: {
			type: String,
			required: false,
			description: 'Additional CSS classes to apply to the image'
		},
		...REFRESH_INTERVAL_ATTRIBUTE,
		...IMAGE_SQL_OPTIONS,
		...WIDTH_ATTRIBUTE
	},
	componentWrapper: {
		display: 'block',
		width: 'fit',
		noCard: true
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% image
    url="https://raw.githubusercontent.com/evidence-dev/media-kit/refs/heads/main/png/wordmark-gray-800.png"
    description="Sample placeholder image"
/%}
`
		},
		{
			title: 'With Dark Mode',
			example: `
{% image
    url="https://raw.githubusercontent.com/evidence-dev/media-kit/refs/heads/main/png/wordmark-gray-800.png"
    dark_url="https://raw.githubusercontent.com/evidence-dev/media-kit/refs/heads/main/png/wordmark-white.png"
    description="Logo that changes in dark mode"
/%}
`
		},
		{
			title: 'From a Data Query',
			example: `
{% image
    data="products"
    column="image_url"
    description_column="product_name"
/%}
`
		},
		{
			title: 'From a Data Query with Filters',
			example: `
{% dropdown id="category_filter" data="products" value_column="category" /%}

{% image
    data="products"
    column="image_url"
    description="Best selling product"
    filters=["category_filter"]
    order="sales desc"
/%}
`
		}
	]
} satisfies UserComponentSchema;
