import type { UserComponent } from '../../types';
import Select from './Dropdown.svelte';
import { DropdownFilter } from './DropdownFilter.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Select,
	Filter: DropdownFilter
};
