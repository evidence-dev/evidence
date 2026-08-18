import type { UserComponent } from '../../types';
import Heatmap from './Heatmap.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Heatmap
};
