import type { ValidationError } from '@markdoc/markdoc';
import { z } from 'zod';
import type { UserComponentSchema } from '../../types';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { ZodAttribute } from '../../common/zod-attribute';
import { DATE_RANGES_TUPLE, isValidDateRangeExpression } from '../../common/date-options';
import { CUSTOM_RANGE_GRAINS } from '../../common/custom-ranges';
import { validateDefaultAgainstPresets } from '../../validators';

// Accepts a preset key OR any other string (a custom_ranges label, a variable) — the enum branch makes the
// docs generator render the preset keys as an "Allowed values" list, while the string branch keeps it
// permissive (strict `matches` would reject labels/variables). Real validation is in `validate` below.
const dateRangeValue = z.union([z.enum(DATE_RANGES_TUPLE), z.string()]);

const CUSTOM_RANGE_ENTRY_KEYS = ['label', 'range', 'grain'];

// Markdoc only type-checks that `custom_ranges` is an array; it can't see inside each entry. Flag the
// common silent footguns (a malformed entry otherwise just drops from the picker with no feedback). These
// are warnings, not errors, so a typo in one preset never blanks the whole calendar on a published page.
function validateCustomRanges(
	entries: unknown[],
	location: ValidationError['location']
): ValidationError[] {
	const errors: ValidationError[] = [];
	const warn = (message: string) =>
		errors.push({ id: 'invalid-custom-ranges', level: 'warning', message, location });
	for (const entry of entries) {
		if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
		const rule = entry as Record<string, unknown>;
		for (const key of Object.keys(rule)) {
			if (!CUSTOM_RANGE_ENTRY_KEYS.includes(key)) {
				warn(`custom_ranges: unknown key "${key}" — expected label, range, or grain.`);
			}
		}
		const range = rule.range;
		const hasRange =
			typeof range === 'string'
				? range.trim() !== ''
				: Array.isArray(range)
					? range.length > 0
					: range != null;
		if (!hasRange) warn('custom_ranges: each entry needs a `range`.');
		// Empty grain ("") = "no grain" (e.g. the autocomplete tab stop left blank); only flag a non-empty unknown.
		const grain = typeof rule.grain === 'string' ? rule.grain.trim().toLowerCase() : '';
		if (grain && !CUSTOM_RANGE_GRAINS.includes(grain)) {
			warn(
				`custom_ranges: grain "${rule.grain}" is not valid — use day, week, month, quarter, or year.`
			);
		}
		// Any non-string label is dropped at runtime (the resolver only fills string templates), so warn
		// on every non-string — objects/arrays included — to match what actually happens.
		if (rule.label != null && typeof rule.label !== 'string') {
			warn('custom_ranges: `label` must be a string.');
		}
	}
	return errors;
}

export const schema = {
	render: 'range_calendar',
	category: 'input',
	description: 'Display a date range picker for use in SQL query templates',
	keywords: [
		'date range',
		'date filter',
		'date picker',
		'date range filter',
		'date range picker',
		'date range input',
		'date input',
		'date selector',
		'date dropdown',
		'calendar filter',
		'calendar input',
		'time range',
		'time filter',
		'start date',
		'end date'
	],
	attributes: {
		id: {
			type: String,
			description:
				'The id of the date range picker to be used in SQL query templates (e.g., `{{date_filter.filter}}`)',
			required: true,
			affectsQuery: false
		},
		title: {
			type: String,
			description: 'Text displayed above the date range picker',
			required: false,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		default_range: {
			type: ZodAttribute.create(dateRangeValue),
			description:
				'Default range to select on load: a preset key, or an exact custom_ranges label. Defaults to "all time".',
			required: false,
			default: 'all time',
			affectsQuery: false,
			suggestionType: 'date_range',
			supportsVariables: true,
			variableContext: 'text'
		},
		// Deprecated: use `default_range` instead
		defaultRange: {
			type: ZodAttribute.create(dateRangeValue),
			description:
				'(deprecated) Use default_range instead. Default range preset to select on load.',
			required: false,
			default: 'all time',
			affectsQuery: false,
			deprecated: true,
			suggestionType: 'date_range',
			supportsVariables: true,
			variableContext: 'text'
		},
		preset_ranges: {
			type: Array,
			description:
				'Array of date range keys to show in the preset list. If not provided, the default preset set is used. Single-day `today`/`yesterday` presets and forward-looking `this ...`/`next ...` presets are not shown by default and must be explicitly included here. When "all time" is excluded and no default is specified, the first preset in this list becomes the default.',
			required: false,
			suggestionType: 'date_range',
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		custom_ranges: {
			type: Array,
			description:
				'Named presets added to the preset list. Each entry is `{ label, range, grain }`: `range` is a window (or list of windows) in normal date-range syntax (e.g. "last 6 months", "from 2022-02-01", "2024-01-01 to today"); the optional `grain` (`day`/`week`/`month`/`quarter`/`year`) slices each window into one preset per period (e.g. a fiscal year per year), anchored to an explicit start date; the optional `label` names each preset with `{start:CODE}` / `{end:CODE}` tokens that format that boundary with any value-formatter date code (`{start:yyyy}` → `2024`, `{start:yy}` → `24`, `{start:mmm}` → `Apr`, `{start:mmmm}` → `April`, `{start:mmm yyyy}` → `Apr 2024`, `{start:d}` → `5`, `{start:qq}` → `Q2`, `{end:yy}` → `24`). Write each entry on its own single line (not expanded across lines), as in the examples below.',
			required: false,
			suggestionType: 'custom_ranges',
			affectsQuery: false
		},
		value_column: {
			type: String,
			description:
				"The date column to filter. When set, the calendar can be referenced directly with `{{id.filter}}` or listed in a chart's `filters` prop — and returns `true` (a no-op) when no range is selected, so it never breaks the query. Leave it unset to instead reference the column yourself with `{{id.between}}`.",
			required: false,
			suggested: true,
			suggestionType: 'column',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'text'
		},
		all_time_range: {
			type: ZodAttribute.create(dateRangeValue),
			description:
				'Controls what "all time" resolves to in SQL. `"unbounded"` (default) makes `.between` emit `IS NOT NULL`, so `where="date {{id.between}}"` matches all rows and never breaks. `"none"` keeps the legacy empty string — use it with `[[ ]]` blocks or a `| fallback` when the clause should drop entirely (e.g. to keep NULL-date rows). You can also set a bounded range — a preset key (e.g. `"last 12 months"`), a `custom_ranges` label, or a range expression (e.g. `"from 2022-12-01"`) — so "all time" resolves to that range everywhere (`.between`, `.start`, `.end`, and the `date_range` value).',
			required: false,
			default: 'unbounded',
			affectsQuery: true,
			suggestionType: 'date_range',
			supportsVariables: true,
			variableContext: 'text'
		},
		...WIDTH_ATTRIBUTE
	},
	filterProperties: [
		{
			name: 'start',
			description:
				'Returns the start date as an expression for the active SQL dialect (e.g. `toDate(...)` in ClickHouse or `TO_DATE(...)` in Snowflake). Empty when "all time" is selected — reference it only where an empty value should fail loudly (e.g. `where date >= {{date_filter.start}}`), not in a date spine or axis bound.',
			singleValue: "toDate('2024-01-01') (ClickHouse) / TO_DATE('2024-01-01') (Snowflake)",
			example: `{% range_calendar id="date_filter" /%}

\`\`\`sql filtered_data
select * from events
where event_date >= {{date_filter.start}}
\`\`\``
		},
		{
			name: 'end',
			description:
				'Returns the end date as an expression for the active SQL dialect (e.g. `toDate(...)` in ClickHouse or `TO_DATE(...)` in Snowflake). Empty when "all time" is selected (see `.start`).',
			singleValue: "toDate('2024-12-31') (ClickHouse) / TO_DATE('2024-12-31') (Snowflake)",
			example: `{% range_calendar id="date_filter" /%}

\`\`\`sql filtered_data
select * from events
where event_date <= {{date_filter.end}}
\`\`\``
		},
		{
			name: 'filter',
			description:
				'Returns a complete SQL filter expression for the date range using the active SQL dialect — `value_column >= start AND value_column <= end`. Requires `value_column`: without it (or when no range is selected) it resolves to `true`, i.e. no filtering, so `where="{{id.filter}}"` silently returns everything unless `value_column` is set.',
			singleValue:
				"ClickHouse: event_date >= toDate('2024-01-01') AND event_date <= toDate('2024-12-31'); Snowflake: event_date >= TO_DATE('2024-01-01') AND event_date <= TO_DATE('2024-12-31')",
			example: `{% range_calendar id="date_filter" value_column="event_date" /%}

\`\`\`sql filtered_data
select * from events
where {{date_filter.filter}}
\`\`\``
		},
		{
			name: 'between',
			defaultFor: ['sql'],
			description:
				'Returns a WHERE-clause fragment for the date range in the active SQL dialect: `BETWEEN <start> AND <end>` when a range is selected, and `IS NOT NULL` when "all time" is selected — so `where="date {{date_filter.between}}"` matches all rows and never breaks. Because "all time" emits `IS NOT NULL`, it excludes rows whose date is NULL; set `all_time_range="none"` to restore the legacy empty string (for use with `[[ ]]` blocks or `| fallback`).',
			noSelectionValue: 'IS NOT NULL',
			singleValue:
				"ClickHouse: BETWEEN toDate('2024-01-01') AND toDate('2024-12-31'); Snowflake: BETWEEN TO_DATE('2024-01-01') AND TO_DATE('2024-12-31')",
			example: `{% range_calendar id="date_filter" /%}

\`\`\`sql filtered_data
select * from events
where date {{date_filter.between}}
\`\`\``
		},
		{
			name: 'range',
			defaultFor: ['text', 'column'],
			description:
				'Returns a human-readable description of the selected range. This is the value to use with `date_range` attribute.',
			singleValue: 'Last 6 Months',
			example: `{% range_calendar id="date_filter" /%}

{% line_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    date_range={
        date="date"
        range={{date_filter}}
    }
/%}`
		}
	],
	isFilterInput: true,
	componentWrapper: {
		display: 'block',
		noCard: true,
		width: 'fit',
		flex: {
			grow: 1,
			minWidth: 200,
			automaticallyWrapConsecutiveComponentsInRow: true
		}
	},
	examples: [
		{
			title: 'Using `date_range`',
			hero: true,
			example: `{% range_calendar id="date_filter" /%}

{% line_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    date_grain="month"
    date_range={
        date="date"
        range={{date_filter}}
    }
/%}`
		},
		{
			title: 'Using `where`',
			example: `{% range_calendar id="date_filter" value_column="date" /%}

{% table
    data="demo.daily_orders"
    where="{{date_filter.filter}}"
/%}`
		},
		{
			title: 'Using `filters`',
			example: `{% range_calendar id="date_filter" value_column="date" /%}

{% big_value
    data="demo.daily_orders"
    value="sum(total_sales)"
    filters=["date_filter"]
/%}`
		},
		{
			title: 'Using Inline SQL',
			example: `{% range_calendar id="date_filter" /%}

\`\`\`sql filtered_orders
select * from demo.daily_orders
where date {{date_filter.between}}
\`\`\`

{% table data="filtered_orders" /%}`
		},
		{
			title: 'Redefining "all time" with `all_time_range`',
			example: `{% range_calendar id="date_filter" value_column="date" all_time_range="from 2022-12-01" /%}

{% big_value
    data="demo.daily_orders"
    value="sum(total_sales)"
    filters=["date_filter"]
/%}`
		},
		{
			title: 'Named presets with `custom_ranges`',
			example: `{% range_calendar
    id="date_filter"
    custom_ranges=[
        { range="last 30 days" },
        { label="FY{start:yyyy}" range="from 2022-02-01" grain="year" },
        { label="Retail {end:yyyy}" range=[
            "2024-12-29 to 2025-12-27",
            "2025-12-28 to 2026-12-26"
        ] }
    ]
/%}`
		}
	],
	validate: (node, config, context) => {
		const customRanges = node.attributes.custom_ranges;
		// With custom_ranges the default may be a generated label we can't resolve statically, so skip the
		// default_range preset check — but still flag malformed custom_ranges entries.
		if (Array.isArray(customRanges) && customRanges.length > 0) {
			return validateCustomRanges(customRanges, node.location);
		}
		const errors: ValidationError[] = [];
		// Every range a user types is validated by the one shared grammar (isValidDateRangeExpression), so
		// default_range and all_time_range allow/deny exactly the same values as the `date_range` attribute.
		// all_time_range additionally accepts the "unbounded"/"none" sentinels. (custom_ranges labels can't be
		// resolved statically, so the early return above defers this check whenever custom_ranges is present.)
		const allTimeRange = node.attributes.all_time_range;
		if (
			typeof allTimeRange === 'string' &&
			allTimeRange &&
			allTimeRange !== 'unbounded' &&
			allTimeRange !== 'none' &&
			!isValidDateRangeExpression(allTimeRange)
		) {
			errors.push({
				id: 'invalid-all-time-range',
				level: 'error',
				message: `all_time_range "${allTimeRange}" is not "unbounded", "none", or a valid range.`,
				location: node.location
			});
		}
		for (const attr of ['default_range', 'defaultRange'] as const) {
			const value = node.attributes[attr];
			if (typeof value === 'string' && value && !isValidDateRangeExpression(value)) {
				errors.push({
					id: 'invalid-default-range',
					level: 'error',
					message: `${attr} "${value}" is not a recognized date range.`,
					location: node.location
				});
			}
		}
		if (errors.length > 0) return errors;
		return validateDefaultAgainstPresets({
			defaultAttrs: ['default_range', 'defaultRange'],
			presetsAttr: 'preset_ranges',
			errorId: 'invalid-default-range',
			displayName: 'default_range'
		})(node, config, context);
	}
} as const satisfies UserComponentSchema;
