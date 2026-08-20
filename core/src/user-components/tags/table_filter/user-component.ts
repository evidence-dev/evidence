import type { UserComponent } from '../../types';
import TableFilter from './TableFilter.svelte';
import { schema } from './schema';
import { TableFilterFilter } from './TableFilterFilter.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: TableFilter,
	Filter: TableFilterFilter
};
