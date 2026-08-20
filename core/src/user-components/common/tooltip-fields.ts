import { z } from 'zod';
import type { UserComponentAttribute } from '../types';
import { ZodAttribute } from './zod-attribute';
import { setZodMetadata } from './zod-metadata';
import { processColumnExpression, type ProcessedColumnExpression } from './sql-expression-utils';
import type { SqlDialect } from '../../sql-dialect';
import { ALL_FORMAT_OPTIONS, formatValue } from '../formatValue';
import { containsVariableSyntax, type Validator } from '../validators/types';

/**
 * Tooltip fields let chart authors surface extra values in a chart's hover
 * tooltip without dropping to `custom_echart`. Each field is an aggregate (or
 * GROUP BY–safe) SQL expression that gets appended to the chart's SELECT and
 * rendered as an extra row under the primary value on hover.
 */
export const tooltipFieldSchema = z.object({
	value: setZodMetadata(
		z
			.string({
				description:
					'SQL expression to include in the tooltip (e.g., "sum(share)"). Must be an aggregate or a GROUP BY–safe column.'
			})
			.min(1, { message: 'tooltip field "value" is required' }),
		{ suggestionType: 'sql', supportsVariables: true }
	),
	label: setZodMetadata(
		z
			.string({
				description:
					'Label shown to the left of the value. Defaults to a title-cased version of the SQL expression.'
			})
			.optional(),
		{ supportsVariables: true }
	),
	fmt: setZodMetadata(
		z
			.string({
				description:
					'Format code applied to the value. Accepts built-in codes (e.g., "usd", "pct1", "num0") or Excel-style custom formats. Common patterns: `"+#,##0;-#,##0"` to always show a sign, `"$#,##0.00;($#,##0.00)"` for accounting-style negatives, `"pct1"` for signed percentages when combined with `color_by_sign`. Defaults to "num". See [Value Formatting](/core-concepts/value-formatting).'
			})
			.optional(),
		{ suggestionType: 'format', supportsVariables: true }
	),
	color_by_sign: z
		.boolean({
			description:
				'Colour the value green when ≥ 0 and red when < 0. Uses the theme\'s positive/negative tokens so it stays consistent with `delta` and `benchmark_comparison`.'
		})
		.optional()
		.default(false),
	down_is_good: z
		.boolean({
			description:
				'Flip the sign colouring so negatives are green and positives are red. Only takes effect when `color_by_sign` is true.'
		})
		.optional()
		.default(false)
});

export const tooltipFieldsSchema = z.array(tooltipFieldSchema).optional();

export type TooltipFieldInput = z.input<typeof tooltipFieldSchema>;
export type TooltipField = z.output<typeof tooltipFieldSchema>;

/**
 * Reusable Markdoc attribute for chart schemas.
 *
 * Usage in a chart schema:
 * ```ts
 * const attributes = {
 *   ...TOOLTIP_FIELDS_ATTRIBUTE,
 *   // ...
 * } as const satisfies UserComponentSchema['attributes'];
 * ```
 */
export const TOOLTIP_FIELDS_ATTRIBUTE = {
	tooltip_fields: {
		type: ZodAttribute.create(tooltipFieldsSchema),
		required: false,
		description:
			'Extra columns to include in the tooltip on hover. Each entry is `{ value, label?, fmt?, color_by_sign?, down_is_good? }`. See the [tooltip fields guide](/components/tooltip-fields) for examples.',
		affectsQuery: true,
		suggestionType: 'tooltip_fields',
		keywords: ['tooltip', 'hover', 'extra columns', 'context', 'annotations']
	}
} as const satisfies Record<string, UserComponentAttribute>;

/**
 * A tooltip field after SQL processing, ready to be used by chart formatters.
 * `alias` is the column name to read off each data row.
 */
export interface ProcessedTooltipField {
	alias: string;
	label: string;
	fmt: string | undefined;
	color_by_sign: boolean;
	down_is_good: boolean;
}

export interface ResolveTooltipFieldsResult {
	/** Processed SQL columns to append to a chart's SELECT. */
	columns: ProcessedColumnExpression[];
	/** Normalized field metadata, ordered to match `columns`. */
	fields: ProcessedTooltipField[];
}

/**
 * Process a chart's `tooltip_fields` attribute into (a) SQL columns to append
 * to the chart's SELECT and (b) normalized field metadata the tooltip formatter
 * uses at render time. Returns empty arrays when no fields are configured so
 * callers can unconditionally spread the result into their query config.
 */
export function resolveTooltipFields(
	rawFields: TooltipField[] | TooltipFieldInput[] | undefined,
	dialect: SqlDialect
): ResolveTooltipFieldsResult {
	if (!rawFields || rawFields.length === 0) {
		return { columns: [], fields: [] };
	}

	const columns: ProcessedColumnExpression[] = [];
	const fields: ProcessedTooltipField[] = [];

	for (const field of rawFields) {
		// Skip malformed entries defensively — Zod validates at edit-time but a
		// runtime-resolved variable could still produce something invalid.
		if (!field || typeof field !== 'object' || !field.value) continue;

		const processed = processColumnExpression({ value: field.value }, dialect);
		if (!processed.alias) continue;

		columns.push(processed);
		fields.push({
			alias: processed.alias,
			// Fall back to the auto-generated display alias (title-cased expression).
			label: field.label?.trim() ? field.label : processed.displayAlias,
			fmt: field.fmt || undefined,
			color_by_sign: Boolean(field.color_by_sign),
			down_is_good: Boolean(field.down_is_good)
		});
	}

	return { columns, fields };
}

/**
 * Return the subset of `tooltipColumns` whose aliases don't collide with
 * `primaryColumns` (or each other). `processColumnExpression` derives
 * aliases deterministically from the SQL text, so a tooltip_field whose
 * expression matches the primary value column — a real "same metric,
 * different format" case — would otherwise emit duplicate `AS <alias>`
 * clauses that every warehouse rejects. Every chart-specific SQL builder
 * that supports `tooltip_fields` should filter through this before
 * concatenating columns.
 *
 * The dropped columns are unreferenced elsewhere: the tooltip formatter
 * reads `extras[field.alias]`, and the row already carries the value
 * under the retained (primary) alias, so extras still render correctly.
 */
export function dedupeTooltipColumns(
	primaryColumns: readonly ProcessedColumnExpression[],
	tooltipColumns: readonly ProcessedColumnExpression[] | undefined
): ProcessedColumnExpression[] {
	if (!tooltipColumns || tooltipColumns.length === 0) return [];
	const seenAliases = new Set(primaryColumns.map((c) => c.alias));
	const out: ProcessedColumnExpression[] = [];
	for (const col of tooltipColumns) {
		if (seenAliases.has(col.alias)) continue;
		seenAliases.add(col.alias);
		out.push(col);
	}
	return out;
}

/**
 * Given a data row (keyed by column alias) and the processed tooltip fields,
 * return an object of `alias -> raw value` for that row. Used to stash the raw
 * values on ECharts data items via `extras` so the tooltip formatter can read
 * them back without re-querying.
 */
export function extractTooltipExtras(
	row: Record<string, unknown>,
	fields: ProcessedTooltipField[]
): Record<string, unknown> | undefined {
	if (fields.length === 0) return undefined;
	const extras: Record<string, unknown> = {};
	for (const field of fields) {
		extras[field.alias] = row[field.alias];
	}
	return extras;
}

// Match the theme tokens used by `delta` / `benchmark_comparison` so
// tooltip extras stay consistent with the rest of Evidence's UI.
const POSITIVE_COLOR_CLASS = 'text-(--theme-positive)';
const NEGATIVE_COLOR_CLASS = 'text-(--theme-negative)';

/**
 * Format a single tooltip field's value into a `<span>` fragment. Handles the
 * `fmt` code, `color_by_sign`, and `down_is_good` inversion. Returns an empty
 * string when the value is null/undefined (callers can skip empty rows).
 */
export function renderTooltipFieldValue(
	field: ProcessedTooltipField,
	rawValue: unknown
): string {
	if (rawValue === null || rawValue === undefined || rawValue === '') return '';

	const formatted = formatValue(rawValue, field.fmt ?? 'num', String(rawValue));
	const escaped = escapeHtml(formatted);

	if (!field.color_by_sign) return escaped;

	const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);
	if (!Number.isFinite(numericValue) || numericValue === 0) return escaped;

	const isPositive = numericValue > 0;
	const treatAsGood = field.down_is_good ? !isPositive : isPositive;
	const colorClass = treatAsGood ? POSITIVE_COLOR_CLASS : NEGATIVE_COLOR_CLASS;
	return `<span class="${colorClass}">${escaped}</span>`;
}

/**
 * Render the extra tooltip rows for a single hovered series' data item.
 * Returns an array of HTML fragments — one per non-null field — each formed
 * of two spans (`<span>label</span><span>value</span>`) that drop directly
 * into the tooltip's existing 2-column grid. Callers concatenate these into
 * their `tooltipRows` array so the extras inherit the tooltip's exact font
 * size and alignment without an extra wrapper.
 *
 * The rows are visually indistinguishable from the tooltip's built-in
 * key-value rows — no indent, no muting — so extras splice in seamlessly.
 * Rendering per-series repetition is expected when a `series` column
 * splits the query; the label + value make it clear which series each
 * extra belongs to.
 */
export function renderTooltipExtras(
	fields: ProcessedTooltipField[],
	extras: Record<string, unknown> | undefined
): string[] {
	if (!extras || fields.length === 0) return [];
	const rows: string[] = [];
	for (const field of fields) {
		const rendered = renderTooltipFieldValue(field, extras[field.alias]);
		if (!rendered) continue;
		rows.push(`
			<span>${escapeHtml(field.label)}</span>
			<span class="text-right">${rendered}</span>
		`);
	}
	return rows;
}

/**
 * Validator: each entry's `fmt` must be a known format code (or a variable
 * reference, or absent). The Zod schema accepts any string for `fmt`, so
 * without this walk an invalid code like `fmt="usd2"` would clear edit-time
 * validation and silently render garbled output. Mirrors the check
 * `validateFormatCode` does for top-level `fmt` attributes.
 */
export const validateTooltipFieldFormats: Validator = (node) => {
	const raw = node.attributes.tooltip_fields;
	if (!Array.isArray(raw)) return [];

	const errors = [];
	for (let index = 0; index < raw.length; index++) {
		const entry = raw[index];
		if (!entry || typeof entry !== 'object') continue;
		const fmt = (entry as { fmt?: unknown }).fmt;
		if (typeof fmt !== 'string' || fmt.length === 0) continue;
		if (containsVariableSyntax(fmt)) continue;
		if (ALL_FORMAT_OPTIONS.includes(fmt)) continue;
		errors.push({
			id: 'custom-format-code',
			level: 'warning' as const,
			message: `tooltip_fields[${index}].fmt: "${fmt}" is not in the list of built-in formats. Consider checking the built-in list before using a custom format. Note that custom formats must follow Excel-style format codes.`,
			location: node.location
		});
	}
	return errors;
};

// `unknown`: callers pass untyped row values, where a numeric column really is a number.
export function escapeHtml(input: unknown): string {
	if (input === null || input === undefined) return '';
	return String(input)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
