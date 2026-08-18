import type { UserComponent } from '../../../types';
import { schema } from './schema';
import HeatmapLayer from './HeatmapLayer.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: HeatmapLayer
};
