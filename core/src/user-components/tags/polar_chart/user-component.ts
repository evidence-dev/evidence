import type { UserComponent } from '../../types';
import PolarChart from './PolarChart.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: PolarChart
};
