/**
 * Pure helper that compiles and evaluates a custom_echart JS body and returns
 * the option object. Pulled out of runtime-entry.ts so the eval/unwrap logic is
 * unit-testable without booting an iframe or a DOM.
 *
 * Bodies in the wild come in three shapes — all are accepted:
 *   1. Expression — bare object literal:        ` { series: [...] } `
 *   2. Statements — explicit return:            ` const x = ...; return {...}; `
 *   3. Function — arrow or function expression: ` () => { return {...} } `
 *
 * Shape (3) is the natural pattern when an LLM (or a human) is copying off an
 * ECharts example, where the option is the return of `function getOption()`.
 * Rather than reject that with "Chart code must return an ECharts config
 * object" — a message that gave authors zero clue what to change — we detect
 * a returned function and call it. Arguments captured in the closure (data,
 * columns, echarts, theme, fmt, etc.) remain in scope because Function
 * parameters are lexically captured.
 */

const ERROR_NO_OPTION =
	'Chart code must return an ECharts config object — either as an expression body (`{ series: [...] }`), an explicit `return { ... }`, or a function returning one (`() => ({ series: [...] })`).';

export interface EvaluateUserCodeOptions {
	source: string;
	globalNames: readonly string[];
	globalValues: readonly unknown[];
}

/**
 * Compiles the body the way the runtime evaluates it: tries an expression-body
 * wrap first (so bare object literals and arrow functions work), then a
 * statement-body wrap with explicit return. Exported so the validator
 * (validateJsSyntax) can use the IDENTICAL compile pipeline — when the wrap
 * changes here, validation auto-tracks it instead of drifting.
 *
 * Throws on syntax errors (caller decides how to surface). Never runs the
 * code — `new Function(...)` only compiles.
 */
export function compileUserBody(
	source: string,
	globalNames: readonly string[]
): (...args: unknown[]) => unknown {
	try {
		return new Function(
			...globalNames,
			`"use strict";\nreturn (\n${source}\n);`
		) as (...args: unknown[]) => unknown;
	} catch {
		return new Function(...globalNames, `"use strict";\n${source}`) as (
			...args: unknown[]
		) => unknown;
	}
}

export function evaluateUserCode(opts: EvaluateUserCodeOptions): Record<string, unknown> {
	const { source, globalNames, globalValues } = opts;

	const fn = compileUserBody(source, globalNames);

	let result: unknown;
	try {
		result = fn(...globalValues);
		// Auto-unwrap: if the body returned a function (the common
		// `() => ({...})` / `function () { return {...} }` pattern), call it
		// with no args. The user's function closes over the same globals via
		// the outer `new Function` scope, so it doesn't need them re-passed.
		if (typeof result === 'function') {
			result = (result as () => unknown)();
		}
	} catch (error) {
		throw enrichReferenceError(error, globalNames);
	}

	if (result === null || typeof result !== 'object') {
		throw new Error(ERROR_NO_OPTION);
	}
	return result as Record<string, unknown>;
}

/**
 * A bare "echartsData is not defined" gives a debugging agent nothing to act
 * on — naming the actual globals lets it self-correct on the next pass.
 * Cheap and targeted: only ReferenceErrors get rewritten; other throws pass
 * through unchanged with their original stack.
 */
function enrichReferenceError(error: unknown, globalNames: readonly string[]): unknown {
	if (!(error instanceof ReferenceError)) return error;
	const augmented = new ReferenceError(
		`${error.message}. Available globals: ${globalNames.join(', ')}.`
	);
	augmented.stack = error.stack;
	return augmented;
}
