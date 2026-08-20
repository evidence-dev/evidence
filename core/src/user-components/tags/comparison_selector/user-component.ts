import type { UserComponent } from '../../types';
import ComparisonSelector from './ComparisonSelector.svelte';
import { ComparisonSelectorFilter } from './ComparisonSelectorFilter.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: ComparisonSelector,
	Filter: ComparisonSelectorFilter
};
