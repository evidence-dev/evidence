import type { UserComponentSchema } from '../../types';
import { DATE_RANGE_ATTRIBUTE, DATE_GRAIN_ATTRIBUTE } from '../../common/date-options';
import { SQL_OPTIONS, REFRESH_INTERVAL_ATTRIBUTE } from '../../common/sql-options';
import {
	and,
	filtersExist,
	tableExists,
	validateSqlExpression,
	validateDateAttributes,
	validateSqlOptions,
	validateInfoRequiresTitle,
	validateFormatCode,
	validateEmptyAttributes,
	validateVariablesInComponent,
	validateDateRange,
	validateAxisMinMax
} from '../../validators';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { HEIGHT_ATTRIBUTE } from '../../common/height-attribute';
import { CONNECT_GROUP_ATTRIBUTE } from '../../common/connect-group-attribute';
import { ZodAttribute } from '../../common/zod-attribute';
import { z } from 'zod';
import { DATA_ATTRIBUTE, TITLE_ATTRIBUTES } from '../../common/title-attributes';
import { TOOLTIP_FIELDS_ATTRIBUTE, validateTooltipFieldFormats } from '../../common/tooltip-fields';
import { xAxisOptionsSchema } from '../series_charts/combo_chart/x-axis-options-schema';
import { yAxisOptionsSchema } from '../series_charts/combo_chart/y-axis-options-schema';

import { ECHARTS_OPTIONS_ATTRIBUTE } from '../../common/echarts-options-attributes';

const attributes = {
	...DATA_ATTRIBUTE,
	filters: {
		type: Array,
		required: false,
		default: [],
		description: 'IDs of filters to apply to the query',
		suggestionType: 'filter',
		affectsQuery: true
	},
	...DATE_RANGE_ATTRIBUTE,
	...DATE_GRAIN_ATTRIBUTE,
	x: {
		type: String,
		required: true,
		description: 'Column for x-axis (typically date/time)',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	open: {
		type: String,
		required: true,
		description: 'Column for opening price',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	high: {
		type: String,
		required: true,
		description: 'Column for high price',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	low: {
		type: String,
		required: true,
		description: 'Column for low price',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	close: {
		type: String,
		required: true,
		description: 'Column for closing price',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	volume: {
		type: String,
		required: false,
		description: 'Column for trading volume (displayed as bars on secondary y-axis)',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	x_fmt: {
		type: String,
		required: false,
		description: 'Format for x-axis values and labels',
		suggestionType: 'format',
		supportsVariables: true,
		variableContext: 'text'
	},
	y_fmt: {
		type: String,
		required: false,
		description: 'Format for y-axis values and labels',
		suggestionType: 'format',
		supportsVariables: true,
		variableContext: 'text'
	},
	y2_fmt: {
		type: String,
		required: false,
		description: 'Format for secondary y-axis (volume) values',
		suggestionType: 'format',
		supportsVariables: true,
		variableContext: 'text'
	},
	...TITLE_ATTRIBUTES,
	y_axis_options: {
		type: ZodAttribute.create(yAxisOptionsSchema),
		required: false,
		default: {},
		description: 'Configure the y-axis'
	},
	x_axis_options: {
		type: ZodAttribute.create(xAxisOptionsSchema),
		required: false,
		default: {},
		description: 'Configure the x-axis'
	},
	chart_options: {
		type: ZodAttribute.create(
			z.object({
				up_color: z.string().optional().describe('Color for bullish (up) candles'),
				down_color: z.string().optional().describe('Color for bearish (down) candles'),
				zoom: z
					.boolean()
					.optional()
					.default(false)
					.describe('Enables zoom by dragging on the chart area')
			})
		),
		required: false,
		default: {},
		description: 'Candlestick chart configuration options',
		affectsQuery: false
	},
	...REFRESH_INTERVAL_ATTRIBUTE,
	...SQL_OPTIONS,
	...WIDTH_ATTRIBUTE,
	...HEIGHT_ATTRIBUTE,
	...CONNECT_GROUP_ATTRIBUTE,
	...TOOLTIP_FIELDS_ATTRIBUTE,
	...ECHARTS_OPTIONS_ATTRIBUTE
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'candlestick',
	category: 'chart',
	validate: and(
		tableExists('data'),
		filtersExist('filters'),
		validateSqlExpression('x', 'data', 'select'),
		validateSqlExpression('open', 'data', 'select'),
		validateSqlExpression('high', 'data', 'select'),
		validateSqlExpression('low', 'data', 'select'),
		validateSqlExpression('close', 'data', 'select'),
		validateSqlExpression('volume', 'data', 'select'),
		validateSqlExpression('tooltip_fields', 'data', 'select'),
		validateTooltipFieldFormats,
		validateDateAttributes(),
		validateDateRange(),
		validateSqlOptions(),
		validateInfoRequiresTitle,
		validateFormatCode('x_fmt'),
		validateFormatCode('y_fmt'),
		validateFormatCode('y2_fmt'),
		validateAxisMinMax('x_axis_options'),
		validateAxisMinMax('y_axis_options'),
		validateEmptyAttributes(),
		validateVariablesInComponent()
	),
	selfClosing: true,
	description:
		'Display a candlestick chart for OHLC (Open, High, Low, Close) financial data visualization',
	keywords: ['ohlc', 'stock chart', 'financial chart'],
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
\`\`\`sql stock_prices
SELECT '2024-01-01'::date as date, 100.0 as open, 105.0 as high, 95.0 as low, 102.0 as close
UNION ALL SELECT '2024-01-02'::date, 102.0, 108.0, 100.0, 105.0
UNION ALL SELECT '2024-01-03'::date, 105.0, 110.0, 103.0, 108.0
UNION ALL SELECT '2024-01-04'::date, 108.0, 112.0, 106.0, 104.0
UNION ALL SELECT '2024-01-05'::date, 104.0, 107.0, 98.0, 100.0
\`\`\`

{% candlestick
    data="stock_prices"
    x="date"
    open="open"
    high="high"
    low="low"
    close="close"
    y_axis_options={
        min=90
        max=115
    }
/%}
`
		},
		{
			title: 'With Volume',
			example: `
\`\`\`sql stock_prices
SELECT '2024-01-01'::date as date, 100.0 as open, 105.0 as high, 95.0 as low, 102.0 as close, 1500000 as volume
UNION ALL SELECT '2024-01-02'::date, 102.0, 108.0, 100.0, 105.0, 2100000
UNION ALL SELECT '2024-01-03'::date, 105.0, 110.0, 103.0, 108.0, 1800000
UNION ALL SELECT '2024-01-04'::date, 108.0, 112.0, 106.0, 104.0, 2500000
UNION ALL SELECT '2024-01-05'::date, 104.0, 107.0, 98.0, 100.0, 3200000
\`\`\`

{% candlestick
    data="stock_prices"
    x="date"
    open="open"
    high="high"
    low="low"
    close="close"
    volume="volume"
    y2_fmt="num0"
    title="Stock Price with Volume"
    y_axis_options={
        min=90
        max=115
    }
/%}
`
		},
		{
			title: 'With Custom Colors',
			example: `
\`\`\`sql stock_prices
SELECT '2024-01-01'::date as date, 100.0 as open, 105.0 as high, 95.0 as low, 102.0 as close
UNION ALL SELECT '2024-01-02'::date, 102.0, 108.0, 100.0, 105.0
UNION ALL SELECT '2024-01-03'::date, 105.0, 110.0, 103.0, 108.0
UNION ALL SELECT '2024-01-04'::date, 108.0, 112.0, 106.0, 104.0
UNION ALL SELECT '2024-01-05'::date, 104.0, 107.0, 98.0, 100.0
\`\`\`

{% candlestick
    data="stock_prices"
    x="date"
    open="open"
    high="high"
    low="low"
    close="close"
    chart_options={
        up_color="#22c55e"
        down_color="#ef4444"
    }
    y_axis_options={
        min=90
        max=115
    }
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
