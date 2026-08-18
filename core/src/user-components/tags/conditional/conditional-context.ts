import { setContext, getContext } from 'svelte';
import type { Snippet } from 'svelte';

const CONDITIONAL_CONTEXT = Symbol('conditional-context');

export type Condition = {
	id: string;
	condition?: () => boolean | undefined;
	snippet?: Snippet;
};

export type ConditionalContext = {
	addCondition: (
		id: string,
		tag: string,
		condition: () => boolean | undefined,
		snippet?: Snippet
	) => string;
	removeCondition: (id: string) => void;
	shouldRender: (id: string) => boolean;
	/** Returns true when all conditions have evaluated (no `undefined` results).
	 *  Used by Else to delay readiness until the conditional decision is made. */
	isResolved: () => boolean;
	/** Report a branch's query error (null clears) so a failure isn't treated as "no rows".
	 *  `retry` re-runs that branch's query; `isRefreshing` reports whether that retry is in flight. */
	setError: (id: string, error: string | null, opts?: BranchErrorOpts) => void;
	getError: () => (BranchErrorOpts & { message: string }) | null;
};

export type BranchErrorOpts = { retry?: () => void; isRefreshing?: () => boolean };

export function setConditionalContext(ctx: ConditionalContext) {
	setContext(CONDITIONAL_CONTEXT, ctx);
}

export function getConditionalContext(): ConditionalContext {
	return getContext(CONDITIONAL_CONTEXT);
}
