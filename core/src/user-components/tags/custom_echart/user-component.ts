import type { UserComponent } from '../../types';
import CustomEChart from './CustomEChart.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: CustomEChart
};
