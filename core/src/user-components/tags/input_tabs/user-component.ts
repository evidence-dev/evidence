import type { UserComponent } from '../../types';
import { schema } from './schema';
import InputTabs from './InputTabs.svelte';
import { InputTabsFilter } from './InputTabsFilter.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: InputTabs,
	Filter: InputTabsFilter
};
