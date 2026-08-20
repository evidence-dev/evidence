import Markdoc, { type Config, type Node, type ValidationError } from '@markdoc/markdoc';
import type { UserComponentSchema } from '../../types';
import { DATE_RANGE_ATTRIBUTE } from '../../common/date-options';
import { SQL_OPTIONS, REFRESH_INTERVAL_ATTRIBUTE } from '../../common/sql-options';
import {
	and,
	filtersExist,
	tableExists,
	validateDateAttributes,
	validateDateRange,
	validateSqlOptions,
	validateInfoRequiresTitle,
	validateEmptyAttributes,
	validateVariablesInComponent,
	type Validator
} from '../../validators';
import { isValidationContext } from '../../validators/types';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { HEIGHT_ATTRIBUTE } from '../../common/height-attribute';
import { CONNECT_GROUP_ATTRIBUTE } from '../../common/connect-group-attribute';
import { ZodAttribute } from '../../common/zod-attribute';
import { z } from 'zod';
import JSON5 from 'json5';
import { extractConfigSource } from './extract-config-source';
import { parseCustomEchartConfig } from './parse-custom-echart-config';
import { validateJsSyntax } from './interpolate-js-source';
import {
	VariableProcessor,
	interpolateFrontmatterVariables
} from '../../../filter-variables/VariableProcessor';
import { createFrontmatterVariablePattern } from '../../../filter-variables/frontmatter-variable';

/**
 * Pick the render path (declarative JSON or sandboxed JS) for a body.
 *
 * Auto-detect rule: JSON5 *syntax* failure → JS mode. Shape failure (parses as
 * JSON5 but isn't an object — e.g. `[1, 2, 3]`) stays in JSON mode so the
 * "must be an object" error surfaces in the declarative path rather than
 * silently iframe-rendering against a body that would fail at runtime anyway.
 *
 * Shared between the validator (for edit-time errors) and the runtime (for
 * branching the render path), so the two stay in sync.
 */
export function shouldBeJsMode(source: string | undefined): boolean {
	if (!source?.trim()) return false; // Empty — let JSON mode surface "missing config"
	try {
		JSON5.parse(source);
		return false; // Valid JSON5 syntax — JSON mode (shape errors handled there)
	} catch {
		// Not valid JSON5 syntax — almost certainly JS. The validator will catch
		// the case where JS is also invalid; runtime falls through and the
		// sandbox surfaces its own evaluation error.
		return !validateJsSyntax(source);
	}
}

const validateConfigBody: Validator = (node, config) => {
	const source = extractConfigSource(node, config);
	// Source text unavailable in this validation context — let runtime report
	if (source === undefined) return [];

	const trimmed = source.trim();
	if (!trimmed) {
		return [
			{
				id: 'custom-echart-missing-config',
				level: 'error' as const,
				message: 'config: Add the chart config (JSON5 or JavaScript) in the tag body.',
				location: node.location
			}
		];
	}

	// Three cases to distinguish:
	//   A) JSON5 parses AND result is an object → valid declarative config. Accept.
	//   B) JSON5 parses but result is wrong SHAPE (array/null/primitive) →
	//      author wrote valid JSON5 with the wrong type. Surface the shape
	//      error, don't fall through to JS — they clearly meant JSON5.
	//   C) JSON5 parse error → try JS.
	//        C1) JS valid → sandboxed runtime path. Accept.
	//        C2) JS invalid → BOTH paths failed. Choose error by shape of the
	//            body (open-brace/bracket = author was writing JSON5; else JS).
	//
	// Before this refactor, validateConfigBody gated on shouldBeJsMode (which
	// only returned true after JS already validated), so the invalid-js error
	// was unreachable. Authors who wrote broken JS saw a confusing JSON5
	// parse error like "Unexpected character at line 1" instead of the JS
	// "Unexpected token ')'" they actually wanted.
	const parsed = parseCustomEchartConfig(source);
	if (!parsed.error) return [];

	// parseCustomEchartConfig conflates "JSON5 parse failed" with "JSON5
	// parsed to wrong shape" — disambiguate by re-trying JSON5.parse here.
	// If it succeeds, the original error was a shape error (case B above).
	let json5Parsed = true;
	try {
		JSON5.parse(source);
	} catch {
		json5Parsed = false;
	}

	if (json5Parsed) {
		// Case B: shape error. Author wrote JSON5; surface the shape message.
		return [
			{
				id: 'custom-echart-invalid-config',
				level: 'error' as const,
				message: `config: ${parsed.error}`,
				location: node.location
			}
		];
	}

	// Case C: JSON5 parse failed. Try JS.
	const jsError = validateJsSyntax(source);
	if (!jsError) return [];

	// Case C2: both failed. Heuristic for which error to surface.
	const looksLikeJson5 = trimmed.startsWith('{') || trimmed.startsWith('[');
	if (looksLikeJson5) {
		return [
			{
				id: 'custom-echart-invalid-config',
				level: 'error' as const,
				message: `config: ${parsed.error}`,
				location: node.location
			}
		];
	}
	return [
		{
			id: 'custom-echart-invalid-js',
			level: 'error' as const,
			message: `config: ${jsError}`,
			location: node.location
		}
	];
};

// Walks the raw body source and validates each `{{ ... }}` reference
// individually. Per-reference so the bracket-balance check in
// interpolateQueryStrings doesn't false-positive on adjacent JSON object
// closes (e.g. `{"foo": 1}}` produces `}}` substrings that look like template
// closes but aren't). Filter/inline-query refs go through VariableProcessor
// (same path Markdoc text nodes use); frontmatter refs are checked against
// `config.variables` directly.
const FILTER_REF_PATTERN = /\{\{(?!\s*\$)([^{}]+)\}\}/g;

const validateBodyVariables: Validator = (node, config, context) => {
	const source = extractConfigSource(node, config);
	if (!source) return [];

	const variables = (config as Config & { variables?: Record<string, unknown> }).variables ?? {};
	const errors: ValidationError[] = [];

	// Filter / inline-query references — only validatable when the page-level
	// validation context provides filters and inline queries. Falls back
	// quietly when those aren't available (e.g. lightweight unit tests).
	let match: RegExpExecArray | null;
	if (isValidationContext(context) && context.filters && context.inlineQueries) {
		const processor = new VariableProcessor(context.filters, context.inlineQueries, variables);
		FILTER_REF_PATTERN.lastIndex = 0;
		while ((match = FILTER_REF_PATTERN.exec(source)) !== null) {
			const refErrors = processor.validateString(match[0], { location: node.location });
			for (const err of refErrors) {
				errors.push({ ...err, message: `body: ${err.message}` });
			}
		}
	}

	// Frontmatter references are checked against config.variables directly —
	// VariableProcessor's filter path doesn't surface "undefined frontmatter
	// variable" errors (its interpolateFrontmatterVariables silently leaves
	// the literal in place when the var is missing).
	const frontmatterRefPattern = createFrontmatterVariablePattern();
	while ((match = frontmatterRefPattern.exec(source)) !== null) {
		const root = match[1].trim().split('.')[0];
		if (!(root in variables)) {
			errors.push({
				id: 'unknown-frontmatter-variable',
				level: 'error' as const,
				message: `body: frontmatter variable "$${root}" is not defined`,
				location: node.location
			});
		}
	}

	return errors;
};

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
	filters: {
		type: Array,
		required: false,
		default: [],
		description: 'IDs of filters to apply to the query',
		suggestionType: 'filter',
		affectsQuery: true
	},
	...DATE_RANGE_ATTRIBUTE,
	title: {
		type: String,
		required: false,
		description: 'Title to display above the chart',
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
		description: 'Information tooltip text (can only be used with title)',
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
	renderer: {
		type: ZodAttribute.create(z.enum(['canvas', 'svg'])),
		required: false,
		default: 'canvas',
		description: 'ECharts rendering engine',
		affectsQuery: false
	},
	...REFRESH_INTERVAL_ATTRIBUTE,
	...SQL_OPTIONS,
	...WIDTH_ATTRIBUTE,
	...HEIGHT_ATTRIBUTE,
	...CONNECT_GROUP_ATTRIBUTE
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'custom_echart',
	category: 'chart',
	// JSON5/JS source, not Markdoc — opt text-level validators out of walking
	// the body. Per-reference validation happens in validateBodyVariables.
	bodyLanguage: 'json5',
	validate: and(
		validateConfigBody,
		validateBodyVariables,
		tableExists('data'),
		filtersExist('filters'),
		validateDateAttributes(),
		validateDateRange(),
		validateSqlOptions(),
		validateInfoRequiresTitle,
		validateEmptyAttributes(),
		validateVariablesInComponent()
	),
	selfClosing: false,
	snippet: `{% custom_echart data="$1" %}
{
	xAxis: { type: 'category' },
	yAxis: {},
	series: [{ type: 'bar', encode: { x: '$2', y: '$3' } }]
}
{% /custom_echart %}$0`,
	description:
		'Render any Apache ECharts chart type using a raw ECharts config in the tag body. An escape hatch for charts the built-in components cannot express.',
	keywords: [
		'echarts',
		'custom chart',
		'advanced chart',
		'escape hatch',
		'config',
		'waterfall',
		'bridge'
	],
	attributes,
	// The body is config source code, not content to render: recover its raw
	// text into a `config` prop and drop the children so nothing renders.
	//
	// Frontmatter variables ({{ $foo }}) are substituted here at transform
	// time, matching the convention register-filters.ts uses for initial_value.
	// Filter/inline-query references stay as {{ }} for runtime resolution by
	// resolveText (declarative path) or interpolateJsSource (js path).
	transform(node: Node, config: Config) {
		const transformedAttributes = node.transformAttributes(config);
		const rawSource = extractConfigSource(node, config) ?? '';
		const variables = (config as Config & { variables?: Record<string, unknown> }).variables ?? {};
		const configSource = rawSource.includes('{{')
			? interpolateFrontmatterVariables(rawSource, variables)
			: rawSource;
		return new Markdoc.Tag(
			'custom_echart',
			{ ...transformedAttributes, config: configSource },
			[],
			node.location,
			node.lines
		);
	},
	componentWrapper: {
		display: 'block',
		width: 'full',
		flex: {
			grow: 3,
			minWidth: 320,
			minHeight: 240
		}
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% custom_echart data="demo.daily_orders" %}
{
  xAxis: { type: 'category' },
  yAxis: {},
  series: [{ type: 'bar', encode: { x: 'category', y: 'total_sales' } }]
}
{% /custom_echart %}
`
		},
		{
			title: 'Multiple Series with Tooltip',
			example: `
{% custom_echart data="demo.daily_orders" %}
{
  tooltip: { trigger: 'axis' },
  legend: { show: true },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    { type: 'bar', name: 'Sales', encode: { x: 'category', y: 'total_sales' } },
    { type: 'line', name: 'Transactions', encode: { x: 'category', y: 'transactions' } }
  ]
}
{% /custom_echart %}
`
		},
		{
			title: 'Dataset Transform',
			example: `
{% custom_echart data="demo.daily_orders" %}
{
  dataset: [
    {},
    { transform: { type: 'sort', config: { dimension: 'total_sales', order: 'desc' } } }
  ],
  xAxis: { type: 'category' },
  yAxis: {},
  series: [{ type: 'bar', datasetIndex: 1, encode: { x: 'category', y: 'total_sales' } }]
}
{% /custom_echart %}
`
		},
		{
			title: 'Waterfall (EBITDA Bridge)',
			example: `
<!-- Waterfalls float each bar on a transparent placeholder series; inc/dec/tot must be mutually exclusive per row. fmt: formatters handle currency display, so values stay unscaled in SQL. -->
\`\`\`sql ebitda_bridge
select 'Prior EBITDA' as step, 1 as ord, 0 as placeholder, null as inc, null as dec, 32000000 as tot
union all select 'Home', 2, 32000000, 6200000, null, null
union all select 'Sports', 3, 38200000, 4100000, null, null
union all select 'Groceries', 4, 40000000, null, 2300000, null
union all select 'Current EBITDA', 5, 0, null, null, 40000000
order by ord
\`\`\`

{% custom_echart data="ebitda_bridge" title="EBITDA Bridge" %}
{
  tooltip: { trigger: 'axis', valueFormatter: 'fmt:usd1m' },
  xAxis: { type: 'category', axisLabel: { interval: 0 } },
  yAxis: { axisLabel: { formatter: 'fmt:usd0m' } },
  series: [
    { type: 'bar', stack: 'bridge', silent: true,
      itemStyle: { color: 'transparent' },
      encode: { x: 'step', y: 'placeholder' } },
    { type: 'bar', stack: 'bridge', name: 'Increase',
      itemStyle: { color: '#22A39F' },
      label: { show: true, position: 'top', formatter: 'fmt:usd1m' },
      encode: { x: 'step', y: 'inc' } },
    { type: 'bar', stack: 'bridge', name: 'Decrease',
      itemStyle: { color: '#E2483D' },
      label: { show: true, position: 'bottom', formatter: 'fmt:usd1m' },
      encode: { x: 'step', y: 'dec' } },
    { type: 'bar', stack: 'bridge', name: 'Total',
      itemStyle: { color: '#475569' },
      label: { show: true, position: 'top', formatter: 'fmt:usd1m' },
      encode: { x: 'step', y: 'tot' } }
  ]
}
{% /custom_echart %}
`
		},
		{
			title: 'JavaScript mode (functions, gradients)',
			example: `
<!-- A body with JS function syntax automatically routes to a sandboxed iframe. Globals: data, columns, echarts, theme, fmt. Use real functions when you need them (formatter/tooltip/renderItem) or echarts.graphic. -->
{% custom_echart data="demo.daily_orders" %}
{
  tooltip: { trigger: 'axis', valueFormatter: (value) => fmt(value, 'usd0') },
  xAxis: { type: 'category' },
  yAxis: { axisLabel: { formatter: (value) => fmt(value, 'usd0m') } },
  series: [
    {
      type: 'bar',
      encode: { x: 'category', y: 'total_sales' },
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: theme.colorPalettes.default[0] },
          { offset: 1, color: theme.colorPalettes.default[1] }
        ])
      },
      label: { show: true, formatter: (params) => fmt(params.value.total_sales, 'usd0') }
    }
  ]
}
{% /custom_echart %}
`
		}
	]
} as const satisfies UserComponentSchema;
