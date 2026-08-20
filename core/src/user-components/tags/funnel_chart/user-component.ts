import type { UserComponent } from '../../types';
import FunnelChart from './FunnelChart.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: FunnelChart
};
