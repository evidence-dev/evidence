import { describe, it, expect } from 'vitest';
import { parse, validate } from '../../Renderer/MarkdocProcessor/process-markdoc';
import type { ValidationContext } from '../../validators/types';

// Same parse → validate path the editor's MarkdocProcessor runs, with the
// bare context the OSS/CLI surfaces use (no metadata, so table/column checks
// stay quiet and only schema-level validators speak).
const ctx = (): ValidationContext => ({
	metadata: undefined,
	filters: undefined,
	inlineQueries: undefined,
	trees: undefined
});

const validateTag = (attrs: string) => {
	const source = `{% waterfall_chart ${attrs} /%}`;
	return validate(parse(source, ctx()), ctx()).map((e) => ({
		id: e.error?.id,
		level: e.error?.level
	}));
};

describe('waterfall_chart ordering warning (through the Markdoc pipeline)', () => {
	it('warns when pre-summarized rows have no explicit order', () => {
		const result = validateTag('data="bridge" x="step" y="amount"');
		expect(result).toContainEqual({ id: 'waterfall-unordered-rows', level: 'warning' });
	});

	it('is satisfied by order, x_sort, an aggregate y, or breakdown mode', () => {
		const base = 'data="bridge" x="step"';
		for (const attrs of [
			`${base} y="amount" order="step_order"`,
			`${base} y="amount" x_sort="asc"`,
			`${base} y="amount" x_sort=["Start", "End"]`,
			`${base} y="sum(amount)"`,
			`${base} y="sum(amount)" breakdown="segment"`
		]) {
			expect(validateTag(attrs).map((e) => e.id)).not.toContain('waterfall-unordered-rows');
		}
	});

	it('defers to runtime when y is variable-driven', () => {
		expect(validateTag('data="bridge" x="step" y="{{measure}}"').map((e) => e.id)).not.toContain(
			'waterfall-unordered-rows'
		);
	});
});

describe('waterfall_chart breakdown validation (through the Markdoc pipeline)', () => {
	it('rejects breakdown combined with per-row total markers as a blocking error', () => {
		const result = validateTag(
			'data="revenue" x="period" y="sum(revenue)" breakdown="segment" totals=["2023"]'
		);
		expect(result).toContainEqual({ id: 'waterfall-breakdown-exclusive', level: 'error' });
	});

	it('rejects breakdown combined with tooltip_fields', () => {
		const result = validateTag(
			'data="revenue" x="period" y="sum(revenue)" breakdown="segment" tooltip_fields=[{ value="sum(units)" }]'
		);
		expect(result).toContainEqual({ id: 'waterfall-breakdown-exclusive', level: 'error' });
	});

	it('warns when breakdown is used with a plain y', () => {
		const result = validateTag(
			'data="revenue" x="period" y="revenue" breakdown="segment" order="period"'
		);
		expect(result).toContainEqual({ id: 'expression-missing-aggregation', level: 'warning' });
	});

	it('produces no diagnostics for a well-formed breakdown chart', () => {
		expect(validateTag('data="revenue" x="period" y="sum(revenue)" breakdown="segment"')).toEqual(
			[]
		);
	});
});
