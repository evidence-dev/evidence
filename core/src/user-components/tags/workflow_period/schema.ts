import type { UserComponentSchema } from '../../types';
import { PERIOD_GRAINS, DEFAULT_PERIOD_COUNT } from '../../common/reporting-periods';

/**
 * Not an authorable tag — `registerFiltersFromAST` synthesizes this from
 * frontmatter. It exists as a user component only so the filter has a
 * registered name: `Filters.deserialize` resolves classes through
 * `getFilterClassByUserComponentName`, so an unregistered filter would not
 * survive the SSR round-trip.
 */
export const schema = {
	render: 'workflow_period',
	category: 'input',
	selfClosing: true,
	undocumented: true,
	description: 'Reporting period selected on a workflow report (declared in frontmatter)',
	attributes: {
		id: {
			type: String,
			required: true,
			description: 'The id of the reporting period variable',
			affectsQuery: false
		},
		grain: {
			type: String,
			required: false,
			description: 'The calendar grain each reporting period covers',
			matches: Array.from(PERIOD_GRAINS),
			affectsQuery: false
		},
		periods: {
			type: Number,
			required: false,
			description: `How many complete periods to offer (default ${DEFAULT_PERIOD_COUNT})`,
			affectsQuery: false
		},
		value_column: {
			type: String,
			required: false,
			description: 'Column the period filters on, enabling use in a `filters=[...]` list',
			affectsQuery: false
		}
	},
	filterProperties: [
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
	],
	componentWrapper: false
} as const satisfies UserComponentSchema;
