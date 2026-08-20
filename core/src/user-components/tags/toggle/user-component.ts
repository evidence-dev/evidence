import type { UserComponent } from '../../types';
import Toggle from './Toggle.svelte';
import { schema } from './schema';
import { ToggleFilter } from './ToggleFilter.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Toggle,
	Filter: ToggleFilter
};
