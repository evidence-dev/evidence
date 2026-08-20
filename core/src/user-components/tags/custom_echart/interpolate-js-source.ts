import { USER_CODE_GLOBAL_NAMES } from './sandbox/sandbox-protocol';
import { compileUserBody } from './sandbox/evaluate-user-code';

type ResolveText = (value: string) => string;

const VARIABLE_TOKEN = /\{\{[\s\S]*?\}\}/g;

/**
 * Interpolates `{{ }}` variables into a JavaScript chart body. Unlike the
 * declarative path (which walks a parsed object), the body here is raw code, so
 * naive string substitution would let a resolved value — which can be
 * viewer-controlled via filters — break out of its literal and inject code.
 *
 * Each token is resolved independently and embedded as a JS literal: numbers,
 * booleans, and null stay unquoted (so `max: {{ threshold }}` is a number);
 * everything else is JSON.stringify'd into an inert string literal. The author
 * JS still only executes in the sandbox, but keeping interpolation injection-safe
 * means a filter value can never smuggle code into it.
 */
export function interpolateJsSource(source: string, resolveText: ResolveText): string {
	return source.replace(VARIABLE_TOKEN, (token) => {
		const resolved = resolveText(token);
		try {
			const parsed: unknown = JSON.parse(resolved);
			if (parsed === null || typeof parsed === 'number' || typeof parsed === 'boolean') {
				return JSON.stringify(parsed);
			}
		} catch {
			// Not a JSON scalar — fall through and embed as a quoted string.
		}
		return JSON.stringify(resolved);
	});
}

/**
 * Compile-checks a JS chart body for the editor, returning an error message or
 * undefined. Delegates to the shared `compileUserBody` helper so the wrap
 * pattern + parameter list match the runtime EXACTLY — when the runtime
 * changes how it evaluates user code, validation tracks it automatically and
 * the two can't drift. Without this, strict-mode clashes like `const data = ...`
 * pass validation but throw at runtime, hiding behind a debug_code round-trip.
 */
export function validateJsSyntax(source: string): string | undefined {
	if (!source.trim()) {
		return 'Add the chart code (JavaScript returning an ECharts config object) in the tag body.';
	}
	try {
		compileUserBody(source, USER_CODE_GLOBAL_NAMES);
		return undefined;
	} catch (error) {
		return error instanceof Error ? error.message : 'Invalid JavaScript';
	}
}
