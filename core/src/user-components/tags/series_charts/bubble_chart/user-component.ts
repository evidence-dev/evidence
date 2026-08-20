import type { UserComponent } from '../../../types';
import BubbleChart from './BubbleChart.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: BubbleChart
};
