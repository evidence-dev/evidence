import { describe, expect, it } from 'vitest';
import { compileUserBody, evaluateUserCode } from './evaluate-user-code';
import { validateJsSyntax } from '../interpolate-js-source';
import { USER_CODE_GLOBAL_NAMES } from './sandbox-protocol';

const NAMES = ['data', 'echarts', 'fmt'] as const;
const VALUES = [
	[{ x: 1, y: 2 }],
	{ graphic: {} },
	(value: unknown, code: string) => `${code}:${String(value)}`
];

function evalSource(source: string): Record<string, unknown> {
	return evaluateUserCode({ source, globalNames: NAMES, globalValues: VALUES });
}

describe('evaluateUserCode', () => {
	it('accepts an expression body (bare object literal)', () => {
		expect(evalSource(`{ series: [{ type: 'bar' }] }`)).toEqual({
			series: [{ type: 'bar' }]
		});
	});

	it('accepts a statement body with explicit return', () => {
		const source = `
			const opt = { series: [{ type: 'line' }] };
			return opt;
		`;
		expect(evalSource(source)).toEqual({ series: [{ type: 'line' }] });
	});

	it('auto-unwraps a body that returns an arrow function', () => {
		const source = `() => ({ series: [{ type: 'bar' }] })`;
		expect(evalSource(source)).toEqual({ series: [{ type: 'bar' }] });
	});

	it('auto-unwraps a body wrapped in an arrow function with statements', () => {
		// The common LLM-copy-paste pattern: full function with internal logic
		// that references closure-captured globals (`data` here).
		const source = `
			() => {
				const rows = [...data];
				return { series: [{ type: 'bar', data: rows.map(r => r.y) }] };
			}
		`;
		const result = evalSource(source);
		expect(result).toEqual({
			series: [{ type: 'bar', data: [2] }]
		});
	});

	it('auto-unwraps a named function expression', () => {
		const source = `function getOption() { return { series: [] }; }`;
		expect(evalSource(source)).toEqual({ series: [] });
	});

	it('exposes the globals to closures inside auto-unwrapped functions', () => {
		const source = `() => ({ formatted: fmt(data[0].x, 'usd0') })`;
		expect(evalSource(source)).toEqual({ formatted: 'usd0:1' });
	});

	it('throws a friendly error when nothing usable is returned', () => {
		expect(() => evalSource(`return 42`)).toThrow(/expression body|return|function returning/);
	});

	it('throws when a returned function does not return an object', () => {
		expect(() => evalSource(`() => 42`)).toThrow(/expression body|return|function returning/);
	});

	it('throws when the body returns null', () => {
		expect(() => evalSource(`return null`)).toThrow();
	});

	it('enriches ReferenceError with the list of available globals', () => {
		expect(() => evalSource(`() => ({ x: echartsData })`)).toThrow(
			/echartsData.*Available globals: data, echarts, fmt/
		);
	});

	it('does NOT unwrap arrays (typeof === "object", returned as-is)', () => {
		// Arrays are not valid ECharts options at the top level but the runtime's
		// auto-unwrap should only kick in for functions, not for arrays.
		const result = evalSource(`[1, 2, 3]`);
		expect(Array.isArray(result)).toBe(true);
	});
});

describe('validator/runtime sync contract', () => {
	// Contract test: validation (validateJsSyntax) and runtime evaluation
	// (compileUserBody) must agree on what compiles. If one accepts a body
	// the other rejects (or vice versa), the agent sees mismatched behavior
	// — edit_page accepts, runtime explodes; or edit_page rejects something
	// that would have worked. Both paths route through `compileUserBody`
	// now, but pin that with tests so a future refactor that bypasses the
	// shared helper triggers a loud failure here instead of a silent drift.

	function runtimeCompiles(source: string): boolean {
		try {
			compileUserBody(source, USER_CODE_GLOBAL_NAMES);
			return true;
		} catch {
			return false;
		}
	}

	const cases = [
		// Valid in both
		'({ series: [] })',
		'{ series: [] }',
		'const x = 1; return { series: [{ data: [x] }] };',
		'() => ({ series: [] })',
		'const myRows = data.filter(r => r.x > 0); return { series: [] };',
		// Invalid in both — global-name clashes
		'const data = []; return {};',
		'const fmt = "usd"; return {};',
		'const echarts = null; return {};',
		// Invalid in both — generic syntax errors
		'{ series: [ }',
		'const x = ;',
		// Edge: empty body. Validator returns its own "add code" message;
		// runtime compiles a body that returns undefined. Tested separately.
	];

	for (const source of cases) {
		it(`validator and runtime agree on: ${JSON.stringify(source).slice(0, 60)}`, () => {
			const validatorAccepts = validateJsSyntax(source) === undefined;
			const runtimeAccepts = runtimeCompiles(source);
			expect(validatorAccepts).toBe(runtimeAccepts);
		});
	}
});
