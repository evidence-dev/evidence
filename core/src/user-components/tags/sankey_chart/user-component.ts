import type { UserComponent } from '../../types';
import SankeyChart from './SankeyChart.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: SankeyChart
};
