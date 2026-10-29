import { getContext, setContext } from 'svelte';
import type { RepeatIteration } from '../../../print-outline/section-key';

const REPEAT_ITERATION_CONTEXT_KEY = Symbol('REPEAT_ITERATION');

/** The enclosing repeat iterations, outermost first; empty outside any repeat. */
export const getRepeatIterationChain = (): readonly RepeatIteration[] =>
	getContext<readonly RepeatIteration[] | undefined>(REPEAT_ITERATION_CONTEXT_KEY) ?? [];

export const setRepeatIterationChain = (chain: readonly RepeatIteration[]) => {
	setContext(REPEAT_ITERATION_CONTEXT_KEY, chain);
};
