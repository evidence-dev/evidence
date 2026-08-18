import { getContext, setContext } from 'svelte';
import type { BenchmarkComparisonOption, TargetComparisonOption } from './types';

const COMPARISON_SELECTOR_CONTEXT_KEY = Symbol('COMPARISON_SELECTOR_CONTEXT');

type CustomComparisonOption = BenchmarkComparisonOption | TargetComparisonOption;

interface ComparisonSelectorContext {
	addOption: (option: CustomComparisonOption) => void;
	removeOption: (option: CustomComparisonOption) => void;
}

export const setComparisonSelectorContext = (context: ComparisonSelectorContext) =>
	setContext(COMPARISON_SELECTOR_CONTEXT_KEY, context);

export const getComparisonSelectorContext = (): ComparisonSelectorContext | undefined => {
	try {
		return getContext(COMPARISON_SELECTOR_CONTEXT_KEY);
	} catch {
		return undefined;
	}
};
