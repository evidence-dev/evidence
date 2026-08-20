import type { UserComponent } from '../../../types';
import HorizontalBarChart from './HorizontalBarChart.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: HorizontalBarChart
};
