import type { UserComponent } from '../../types';
import WaterfallChart from './WaterfallChart.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: WaterfallChart
};
