/**
 * Navigation shim — stands in for `$app/navigation`'s `goto` in the vitest test
 * environment, where SvelteKit's real virtual module isn't present. In the
 * studio app build, `$app/navigation` resolves to SvelteKit's real `goto`; this
 * shim exists only so core modules that import `goto` (e.g. Html.svelte's
 * `evidence.navigate` handler) can load under test. It's a no-op.
 */
export async function goto(url: string | URL, _opts?: unknown): Promise<void> {
	void url;
	void _opts;
}
