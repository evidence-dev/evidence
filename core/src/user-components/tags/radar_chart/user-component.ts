import type { UserComponent } from '../../types';
import RadarChart from './RadarChart.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: RadarChart
};
