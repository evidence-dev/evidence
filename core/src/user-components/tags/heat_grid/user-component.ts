import type { UserComponent } from '../../types';
import HeatGrid from './HeatGrid.svelte';
import { schema } from './schema';
import { HeatGridModel } from './HeatGridModel.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: HeatGrid,
	Model: HeatGridModel
};
