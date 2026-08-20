import type { UserComponentSchema } from '../../types';
import {
	and,
	tableExists,
	filtersExist,
	validateSqlOptions,
	validateEmptyAttributes,
	validateVariablesInComponent,
	validateNumberRange
} from '../../validators';
import { SQL_OPTIONS } from '../../common/sql-options';
import { MAX_DOWNLOAD_LIMIT } from '../../../constants/downloadLimit';

const attributes = {
	data: {
		type: String,
		required: true,
		suggestionType: 'table',
		description: 'Table or view to download',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'text'
	},
	label: {
		type: String,
		required: false,
		default: 'Download',
		description: 'Text displayed on the download button',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	filename: {
		type: String,
		required: false,
		description: 'Name of the downloaded file (without extension)',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	variant: {
		type: String,
		description: 'Button style variant',
		required: false,
		default: 'default',
		matches: ['default', 'primary', 'destructive', 'secondary', 'ghost', 'link'],
		affectsQuery: false
	},
	filters: {
		type: Array,
		required: false,
		description: 'IDs of filters to apply to the query',
		suggestionType: 'filter',
		affectsQuery: true
	},
	...SQL_OPTIONS
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'download',
	category: 'ui',
	validate: and(
		tableExists('data'),
		filtersExist('filters'),
		validateSqlOptions(),
		validateNumberRange('limit', {
			min: 1,
			max: MAX_DOWNLOAD_LIMIT,
			integersOnly: true,
			displayName: 'limit'
		}),
		validateEmptyAttributes(),
		validateVariablesInComponent()
	),
	selfClosing: true,
	description:
		'A button to download data as an Excel file, supports up to 500,000 row downloads via the limit attribute.',
	attributes,
	componentWrapper: {
		display: 'inline'
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% download data="demo.daily_orders" /%}
`
		},
		{
			title: 'Custom Label and Filename',
			example: `
{% download
  data="demo.daily_orders"
  label="Export Orders"
  filename="daily_orders_export"
/%}
`
		},
		{
			title: 'With Variant',
			example: `
{% download
  data="demo.daily_orders"
  label="Export Data"
  variant="primary"
/%}
`
		},
		{
			title: 'With Large Limit',
			example: `
{% download
  data="demo.daily_orders"
  label="Download Recent Orders"
  limit=50000
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
