import type { UserComponent } from '../../../types';
import LineChart from './LineChart.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: LineChart
};
