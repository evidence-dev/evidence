import type { UserComponent } from '../../types';
import FilterBar from './FilterBar.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: FilterBar
};
