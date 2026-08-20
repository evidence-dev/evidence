import { describe, it, expect } from 'vitest';
import type { Config, Node } from '@markdoc/markdoc';
import {
	tooltipFieldSchema,
	tooltipFieldsSchema,
	resolveTooltipFields,
	extractTooltipExtras,
	renderTooltipFieldValue,
	renderTooltipExtras,
	escapeHtml,
	validateTooltipFieldFormats,
	type ProcessedTooltipField
} from './tooltip-fields';
import { defaultDialect } from '../../sql-dialect';

function makeNode(tooltip_fields: unknown): Node {
	return {
		attributes: { tooltip_fields },
		location: { start: { line: 1 }, end: { line: 1 } }
	} as unknown as Node;
}

const config = {} as Config;

describe('escapeHtml', () => {
	it('encodes characters that can create HTML elements or attributes', () => {
		expect(escapeHtml(`<img src="x" onerror='alert(1)'>&`)).toBe(
			'&lt;img src=&quot;x&quot; onerror=&#39;alert(1)&#39;&gt;&amp;'
		);
	});

	// Formatters only cast the row value to string; a numeric point_title really is a number.
	it('coerces a non-string instead of throwing', () => {
		expect(escapeHtml(2026)).toBe('2026');
		expect(escapeHtml(true)).toBe('true');
	});

	it('renders null and undefined as nothing rather than their names', () => {
		expect(escapeHtml(null)).toBe('');
		expect(escapeHtml(undefined)).toBe('');
	});

	it('escapes a payload that only appears once coerced', () => {
		expect(escapeHtml({ toString: () => '<b>' })).toBe('&lt;b&gt;');
	});
});

describe('tooltipFieldSchema (Zod validation)', () => {
	it('accepts a minimal field with just a value', () => {
		const parsed = tooltipFieldSchema.parse({ value: 'sum(share)' });
		expect(parsed).toEqual({
			value: 'sum(share)',
			color_by_sign: false,
			down_is_good: false
		});
	});

	it('accepts all fields including color_by_sign and down_is_good', () => {
		const parsed = tooltipFieldSchema.parse({
			value: 'sum(pt_chg)',
			label: 'PT Chg',
			fmt: 'pct1',
			color_by_sign: true,
			down_is_good: true
		});
		expect(parsed.color_by_sign).toBe(true);
		expect(parsed.down_is_good).toBe(true);
	});

	it('rejects an empty value string', () => {
		expect(() => tooltipFieldSchema.parse({ value: '' })).toThrow(/value/);
	});

	it('rejects a missing value', () => {
		expect(() => tooltipFieldSchema.parse({ label: 'Share' })).toThrow();
	});

	it('array schema accepts an empty array and undefined', () => {
		expect(tooltipFieldsSchema.parse(undefined)).toBeUndefined();
		expect(tooltipFieldsSchema.parse([])).toEqual([]);
	});
});

describe('resolveTooltipFields', () => {
	it('returns empty arrays when no fields are configured', () => {
		expect(resolveTooltipFields(undefined, defaultDialect)).toEqual({ columns: [], fields: [] });
		expect(resolveTooltipFields([], defaultDialect)).toEqual({ columns: [], fields: [] });
	});

	it('produces one SQL column per field with the field alias exposed', () => {
		const { columns, fields } = resolveTooltipFields(
			[
				{ value: 'sum(share)', label: 'Share', fmt: 'pct1' },
				{ value: 'sum(pt_chg)', color_by_sign: true }
			],
			defaultDialect
		);
		expect(columns).toHaveLength(2);
		expect(fields).toHaveLength(2);
		expect(fields[0].alias).toBe(columns[0].alias);
		expect(fields[1].alias).toBe(columns[1].alias);
	});

	it('uses the user-provided label when present, otherwise the derived display alias', () => {
		const { fields } = resolveTooltipFields(
			[
				{ value: 'sum(share)', label: 'Market Share' },
				{ value: 'sum(pt_chg)' }
			],
			defaultDialect
		);
		expect(fields[0].label).toBe('Market Share');
		expect(fields[1].label).toBeTruthy();
		expect(fields[1].label).not.toBe('');
	});

	it('emits actual SELECT-ready SQL for each column', () => {
		const { columns } = resolveTooltipFields(
			[{ value: 'sum(share)' }],
			defaultDialect
		);
		expect(columns[0].sqlWithAlias).toMatch(/sum\(share\)\s+AS\s+/i);
		expect(columns[0].hasAgg).toBe(true);
	});

	it('skips malformed entries defensively (guards against variable-substituted junk)', () => {
		const { columns, fields } = resolveTooltipFields(
			[
				{ value: 'sum(share)' },
				{ value: '' },
				null as unknown as { value: string },
				{ value: 'avg(x)' }
			],
			defaultDialect
		);
		expect(columns).toHaveLength(2);
		expect(fields).toHaveLength(2);
	});
});

describe('extractTooltipExtras', () => {
	const fields: ProcessedTooltipField[] = [
		{ alias: 'share', label: 'Share', fmt: 'pct1', color_by_sign: false, down_is_good: false },
		{ alias: 'delta', label: 'Δ', fmt: 'usd', color_by_sign: true, down_is_good: false }
	];

	it('returns undefined when no fields are configured (avoids polluting data items)', () => {
		expect(extractTooltipExtras({ share: 0.5 }, [])).toBeUndefined();
	});

	it('picks only the aliased columns from the row', () => {
		const row = { x: '2024', y: 100, share: 0.42, delta: -5, unused: 'x' };
		expect(extractTooltipExtras(row, fields)).toEqual({ share: 0.42, delta: -5 });
	});

	it('preserves undefined values (formatter treats them as skip-this-row)', () => {
		const row = { share: 0.42 };
		expect(extractTooltipExtras(row, fields)).toEqual({ share: 0.42, delta: undefined });
	});
});

describe('renderTooltipFieldValue', () => {
	const plain: ProcessedTooltipField = {
		alias: 'x',
		label: 'X',
		fmt: 'num0',
		color_by_sign: false,
		down_is_good: false
	};

	it('formats numeric values with the configured fmt code', () => {
		expect(renderTooltipFieldValue(plain, 1234)).toBe('1,234');
	});

	it('returns empty string for null/undefined so the row can be skipped', () => {
		expect(renderTooltipFieldValue(plain, null)).toBe('');
		expect(renderTooltipFieldValue(plain, undefined)).toBe('');
		expect(renderTooltipFieldValue(plain, '')).toBe('');
	});

	it('wraps in a positive-colored span when color_by_sign is on and value > 0', () => {
		const field = { ...plain, color_by_sign: true };
		const out = renderTooltipFieldValue(field, 5);
		expect(out).toMatch(/theme-positive/);
		expect(out).not.toMatch(/theme-negative/);
	});

	it('wraps in a negative-colored span when color_by_sign is on and value < 0', () => {
		const field = { ...plain, color_by_sign: true };
		const out = renderTooltipFieldValue(field, -5);
		expect(out).toMatch(/theme-negative/);
		expect(out).not.toMatch(/theme-positive/);
	});

	it('inverts the color mapping when down_is_good is true', () => {
		const field = { ...plain, color_by_sign: true, down_is_good: true };
		expect(renderTooltipFieldValue(field, 5)).toMatch(/theme-negative/);
		expect(renderTooltipFieldValue(field, -5)).toMatch(/theme-positive/);
	});

	it('does not apply color for a zero value even with color_by_sign on', () => {
		const field = { ...plain, color_by_sign: true };
		const out = renderTooltipFieldValue(field, 0);
		expect(out).not.toMatch(/theme-positive/);
		expect(out).not.toMatch(/theme-negative/);
	});
});

describe('renderTooltipExtras', () => {
	const fields: ProcessedTooltipField[] = [
		{ alias: 'share', label: 'Share', fmt: 'pct1', color_by_sign: false, down_is_good: false },
		{ alias: 'delta', label: 'Δ', fmt: 'num0', color_by_sign: true, down_is_good: false }
	];

	it('returns one row fragment per non-null field so the caller can splice them into its grid', () => {
		const rows = renderTooltipExtras(fields, { share: 0.42, delta: -10 });
		expect(rows).toHaveLength(2);
		expect(rows[0]).toContain('Share');
		expect(rows[1]).toContain('Δ');
		expect(rows[1]).toContain('theme-negative');
	});

	it('skips rows for null/undefined values so the tooltip stays clean', () => {
		const rows = renderTooltipExtras(fields, { share: 0.42, delta: null });
		expect(rows).toHaveLength(1);
		expect(rows[0]).toContain('Share');
	});

	it('returns an empty array when every row is null', () => {
		expect(renderTooltipExtras(fields, { share: null, delta: undefined })).toEqual([]);
	});

	it('returns an empty array when there are no fields or no extras', () => {
		expect(renderTooltipExtras([], { share: 0.42 })).toEqual([]);
		expect(renderTooltipExtras(fields, undefined)).toEqual([]);
	});

	it('emits two-cell fragments (label span + value span) that slot into a 2-col grid', () => {
		const rows = renderTooltipExtras(fields, { share: 0.42 });
		// Two `<span>` opens per row (label + value)
		const spanOpens = (rows[0].match(/<span/g) || []).length;
		expect(spanOpens).toBeGreaterThanOrEqual(2);
	});

	it('emits label + value with no extra classes on the label so extras look identical to built-in rows', () => {
		const rows = renderTooltipExtras(fields, { share: 0.42 });
		expect(rows[0]).not.toContain('pl-4');
		expect(rows[0]).not.toContain('opacity');
		// Label cell is a bare `<span>` — same as combo's built-in x-axis row.
		expect(rows[0]).toMatch(/<span>\s*Share\s*<\/span>/);
	});

	it('escapes HTML in labels (defense against angle-bracket or quote-bearing labels)', () => {
		const dangerous: ProcessedTooltipField[] = [
			{
				alias: 'x',
				label: '<script>alert(1)</script>',
				fmt: 'num',
				color_by_sign: false,
				down_is_good: false
			}
		];
		const rows = renderTooltipExtras(dangerous, { x: 1 });
		expect(rows[0]).not.toContain('<script>');
		expect(rows[0]).toContain('&lt;script&gt;');
	});

	it('escapes HTML in unformatted string values', () => {
		const stringField: ProcessedTooltipField[] = [
			{ alias: 'x', label: 'Value', fmt: undefined, color_by_sign: false, down_is_good: false }
		];
		const rows = renderTooltipExtras(stringField, { x: '<img src=x onerror=alert(1)>' });
		expect(rows[0]).not.toContain('<img');
		expect(rows[0]).toContain('&lt;img src=x onerror=alert(1)&gt;');
	});
});

describe('validateTooltipFieldFormats', () => {
	it('returns no errors when tooltip_fields is absent or not an array', () => {
		expect(validateTooltipFieldFormats(makeNode(undefined), config, undefined)).toEqual([]);
		expect(validateTooltipFieldFormats(makeNode('not-an-array'), config, undefined)).toEqual([]);
	});

	it('accepts entries with valid built-in format codes', () => {
		const node = makeNode([
			{ value: 'sum(x)', fmt: 'usd' },
			{ value: 'sum(y)', fmt: 'pct1' },
			{ value: 'sum(z)', fmt: 'num0' }
		]);
		expect(validateTooltipFieldFormats(node, config, undefined)).toEqual([]);
	});

	it('accepts entries with no fmt or empty fmt', () => {
		const node = makeNode([{ value: 'sum(x)' }, { value: 'sum(y)', fmt: '' }]);
		expect(validateTooltipFieldFormats(node, config, undefined)).toEqual([]);
	});

	it('warns on unknown format codes so they don\u2019t silently render garbled values', () => {
		const node = makeNode([
			{ value: 'sum(x)', fmt: 'notaformat' },
			{ value: 'sum(y)', fmt: 'pct' } // valid
		]);
		const errors = validateTooltipFieldFormats(node, config, undefined);
		expect(errors).toHaveLength(1);
		expect(errors[0].level).toBe('warning');
		expect(errors[0].message).toContain('tooltip_fields[0].fmt');
		expect(errors[0].message).toContain('notaformat');
	});

	it('reports the correct entry index when a later entry has an unknown fmt', () => {
		const node = makeNode([
			{ value: 'sum(x)', fmt: 'usd' },
			{ value: 'sum(y)', fmt: 'nopeformat' }
		]);
		const errors = validateTooltipFieldFormats(node, config, undefined);
		expect(errors).toHaveLength(1);
		expect(errors[0].message).toContain('tooltip_fields[1].fmt');
	});

	it('skips fmt values containing variable syntax (unknown until runtime)', () => {
		const node = makeNode([{ value: 'sum(x)', fmt: '{{myfmt}}' }]);
		expect(validateTooltipFieldFormats(node, config, undefined)).toEqual([]);
	});

	it('tolerates malformed entries (null, non-objects) without throwing', () => {
		const node = makeNode([null, 'a string', { value: 'sum(x)', fmt: 'usd' }]);
		expect(validateTooltipFieldFormats(node, config, undefined)).toEqual([]);
	});
});
