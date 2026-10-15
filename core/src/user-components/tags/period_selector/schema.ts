import type { ValidationError } from '@markdoc/markdoc';
import type { UserComponentSchema } from '../../types';
import {
	PERIOD_GRAINS,
	DEFAULT_PERIOD_COUNT,
	MAX_PERIOD_COUNT,
	WORKFLOW_PERIOD_FILTER_ID
} from '../../common/reporting-periods';
import { parseWorkflowPeriod } from '../../../config/workflow-frontmatter';
import { isValidationContext } from '../../validators/types';

export const PERIOD_CONFIG_ATTRIBUTES = {
	grain: {
		type: String,
		required: false,
		description: 'The calendar grain each period covers. Defaults to `month`.',
		matches: Array.from(PERIOD_GRAINS),
		affectsQuery: false
	},
	periods: {
		type: Number,
		required: false,
		description: `How many complete periods to offer. Defaults to ${DEFAULT_PERIOD_COUNT}.`,
		affectsQuery: false
	},
	value_column: {
		type: String,
		required: false,
		description:
			'The date column to filter. When set, the selector can be referenced with `{{id.filter}}` or listed in a chart\'s `filters` prop, e.g. `filters=["sales_period"]`.',
		suggestionType: 'column',
		affectsQuery: false
	}
} as const;

export const PERIOD_FILTER_PROPERTIES: NonNullable<UserComponentSchema['filterProperties']> = [
	{
		name: 'between',
		defaultFor: ['sql'],
		description:
			'A WHERE-clause fragment covering the period in the active SQL dialect: `BETWEEN <start> AND <end>`.',
		singleValue: "BETWEEN toDate('2026-07-01') AND toDate('2026-07-31')"
	},
	{
		name: 'label',
		defaultFor: ['text', 'column'],
		description: 'The period’s display label, e.g. `Jul 2026`.',
		singleValue: 'Jul 2026'
	},
	{
		name: 'start',
		description:
			'The first date of the period, as an expression for the active SQL dialect. Use `start_label` in prose.',
		singleValue: "toDate('2026-07-01')"
	},
	{
		name: 'end',
		description:
			'The last date of the period (inclusive), for the active SQL dialect. Use `end_label` in prose.',
		singleValue: "toDate('2026-07-31')"
	},
	{
		name: 'start_label',
		description: 'The first date of the period, formatted for display.',
		singleValue: 'Jul 1, 2026'
	},
	{
		name: 'end_label',
		description: 'The last date of the period (inclusive), formatted for display.',
		singleValue: 'Jul 31, 2026'
	},
	{
		name: 'filter',
		description:
			'A complete SQL filter expression for the period. Requires `value_column`; resolves to `true` without it.',
		singleValue: "order_date >= toDate('2026-07-01') AND order_date <= toDate('2026-07-31')"
	},
	{
		name: 'key',
		description:
			'The period’s stable identifier, e.g. `2026-07`. Use it to key per-period records.',
		singleValue: '2026-07'
	},
	{
		name: 'grain',
		description: 'The period grain, e.g. `month`.',
		singleValue: 'month'
	}
];

export const schema = {
	render: 'period_selector',
	category: 'input',
	description:
		'Display a selector that steps through complete calendar periods (months, quarters, and so on). Use `id="period"` to place the page’s `workflow.period` selector.',
	keywords: [
		'period',
		'reporting period',
		'month picker',
		'quarter picker',
		'year picker',
		'week picker',
		'period picker'
	],
	selfClosing: true,
	attributes: {
		id: {
			type: String,
			required: true,
			description:
				'The id of the period, used in SQL query templates (e.g. `{{my_period.between}}`). On a page with `workflow.period`, `id="period"` places that selector here instead of at the top of the page.',
			affectsQuery: false
		},
		...PERIOD_CONFIG_ATTRIBUTES
	},
	filterProperties: PERIOD_FILTER_PROPERTIES,
	isFilterInput: true,
	componentWrapper: {
		display: 'block',
		noCard: true,
		width: 'fit',
		flex: {
			grow: 0,
			minWidth: 200,
			fitContent: true,
			automaticallyWrapConsecutiveComponentsInRow: true
		}
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `{% period_selector id="sales_period" grain="quarter" /%}

{% big_value
    data="demo.daily_orders"
    value="sum(total_sales)"
    where="date {{sales_period.between}}"
/%}`
		},
		{
			title: 'Using `filters`',
			example: `{% period_selector id="sales_period" grain="quarter" value_column="date" /%}

{% line_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    filters=["sales_period"]
/%}`
		},
		{
			title: 'Placing the `workflow.period` selector',
			example: `---
workflow:
  period:
    grain: quarter
---

{% row align="center" justify="between" %}
# {{ period.label }} Review
{% period_selector id="period" /%}
{% /row %}`
		}
	],
	validate: (node, config, context) => {
		const errors: ValidationError[] = [];
		const periods = node.attributes.periods;
		if (
			typeof periods === 'number' &&
			(!Number.isInteger(periods) || periods < 1 || periods > MAX_PERIOD_COUNT)
		) {
			errors.push({
				id: 'period-selector-invalid-periods',
				level: 'error',
				message: `periods must be a whole number from 1 to ${MAX_PERIOD_COUNT}. Got ${periods}.`,
				location: node.location
			});
		}
		if (node.attributes.id !== WORKFLOW_PERIOD_FILTER_ID) return errors;

		if (!parseWorkflowPeriod(config.variables as { workflow?: unknown } | undefined)) {
			// A partial or component can't see its host page's frontmatter.
			const basePath = isValidationContext(context) ? (context.basePath ?? '') : '';
			if (/^(partials|components)\//.test(basePath)) return errors;
			errors.push({
				id: 'period-selector-reserved-id',
				level: 'warning',
				message:
					'"period" is the id of the page\'s reporting period, which this page doesn\'t declare. Add workflow.period to the frontmatter, or use a different id for an independent period.',
				location: node.location
			});
			return errors;
		}
		const set = Object.keys(PERIOD_CONFIG_ATTRIBUTES).filter(
			(name) => node.attributes[name] !== undefined
		);
		if (set.length > 0) {
			errors.push({
				id: 'period-selector-workflow-config',
				level: 'error',
				message: `This selector places the page's workflow.period, which is configured in the frontmatter. Remove ${set.join(', ')}, or use a different id for an independent period.`,
				location: node.location
			});
		}
		return errors;
	}
} as const satisfies UserComponentSchema;
