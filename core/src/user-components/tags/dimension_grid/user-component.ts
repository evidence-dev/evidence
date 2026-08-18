import type { UserComponent } from '../../types';
import DimensionGrid from './DimensionGrid.svelte';
import { DimensionGridFilter } from './DimensionGridFilter.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: DimensionGrid,
	Filter: DimensionGridFilter
};
