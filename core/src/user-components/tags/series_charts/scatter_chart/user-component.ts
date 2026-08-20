import type { UserComponent } from '../../../types';
import ScatterChart from './ScatterChart.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: ScatterChart
};
