import type { UserComponent } from '../../types';
import DateGrainSelector from './DateGrainSelector.svelte';
import { DateGrainSelectorFilter } from './DateGrainSelectorFilter.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: DateGrainSelector,
	Filter: DateGrainSelectorFilter
};
