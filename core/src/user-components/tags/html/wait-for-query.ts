/**
 * `evidence.query(name)` inside an `{% html %}` block is a ONE-SHOT pull: author
 * code does `const rows = await evidence.query("foo")` at the top level, and if
 * that rejects, the block's script aborts and nothing renders — the pull never
 * retries. So if the request loses a race against the page registering the named
 * ```sql block (which happened for freshly-added blocks: they rendered blank
 * until the author re-pasted the exact same code, which remounted once the query
 * was finally registered), throwing immediately strands the block permanently.
 *
 * This helper bridges that gap: it re-checks the (reactive) inline-queries map
 * for a short window, resolving the instant the query appears and only failing
 * if it never does (a genuine typo / missing query). `resolve` is the caller's
 * `inlineQueries.getInterpolated(name)` thunk — it may throw on a real template
 * error (unbalanced brackets, etc.), which we propagate at once rather than
 * retrying, since waiting wouldn't make a malformed query valid.
 */
export const DEFAULT_QUERY_WAIT_TIMEOUT_MS = 4000;
export const DEFAULT_QUERY_WAIT_POLL_MS = 60;

export interface WaitForQueryOptions {
	timeoutMs?: number;
	pollMs?: number;
	/** Abort early (e.g. the block unmounted) so we don't spin for the full timeout. */
	isDisposed?: () => boolean;
	/** Injectable clock/sleep for deterministic tests. */
	now?: () => number;
	sleep?: (ms: number) => Promise<void>;
}

export async function waitForInterpolatedQuery(
	resolve: () => string | undefined,
	name: string,
	options: WaitForQueryOptions = {}
): Promise<string> {
	const timeoutMs = options.timeoutMs ?? DEFAULT_QUERY_WAIT_TIMEOUT_MS;
	const pollMs = options.pollMs ?? DEFAULT_QUERY_WAIT_POLL_MS;
	const now = options.now ?? (() => Date.now());
	const sleep = options.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

	const deadline = now() + timeoutMs;
	for (;;) {
		if (options.isDisposed?.()) {
			throw new Error(`Query "${name}" was cancelled (the block was removed before it resolved).`);
		}
		// May throw on a genuine template error — let it propagate immediately.
		const subquery = resolve();
		if (subquery) return subquery;
		if (now() >= deadline) {
			throw new Error(`No query named "${name}" found on this page.`);
		}
		await sleep(pollMs);
	}
}
