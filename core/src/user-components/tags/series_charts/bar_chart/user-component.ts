import type { UserComponent } from '../../../types';
import BarChart from './BarChart.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: BarChart
};
