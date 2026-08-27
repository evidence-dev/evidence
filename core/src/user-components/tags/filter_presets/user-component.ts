import type { UserComponent } from '../../types';
import { schema } from './schema';
import FilterPresets from './FilterPresets.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: FilterPresets
};
