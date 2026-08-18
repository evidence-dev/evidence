import type { HtmlVariables } from './sandbox/html-protocol';

/**
 * Build the `evidence.variables` snapshot from the tag's `variables={…}` object.
 *
 * Two jobs:
 *   1. Strip non-serializable values (functions, objects, arrays) — postMessage
 *      structured-clones the snapshot and the diff is shallow.
 *   2. Run `resolveText` over string values so Evidence `{{ }}` interpolation
 *      (filter values, repeat scope) resolves — without this a live filter value
 *      written as `variables={ x="{{ f.value }}" }` reaches the sandbox as the
 *      literal token.
 *
 * `resolveText` is injected (it closes over the component's reactive
 * VariableProcessor), so a filter-value change produces a different result — the
 * caller's `$derived` recomputes and re-pushes state. Pure + injected so the
 * interpolation is unit-testable without mounting the component.
 */
export function resolveVariables(
	raw: unknown,
	resolveText: (value: string) => string | null | undefined
): HtmlVariables {
	if (!raw || typeof raw !== 'object') return {};
	const out: HtmlVariables = {};
	for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
		if (typeof value === 'function') continue;
		if (value !== null && typeof value === 'object') continue;
		out[key] =
			typeof value === 'string'
				? ((resolveText(value) ?? value) as HtmlVariables[string])
				: (value as HtmlVariables[string]);
	}
	return out;
}
