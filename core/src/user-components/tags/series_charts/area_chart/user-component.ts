import type { UserComponent } from '../../../types';
import AreaChart from './AreaChart.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: AreaChart
};
