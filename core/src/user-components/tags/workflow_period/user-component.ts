import type { UserComponent } from '../../types';
import { schema } from './schema';
import { PeriodFilter } from './PeriodFilter.svelte';

// No `Component`: the picker is page chrome, not part of the Markdoc tree.
export const userComponent: UserComponent<typeof schema> = {
	schema,
	Filter: PeriodFilter
};
