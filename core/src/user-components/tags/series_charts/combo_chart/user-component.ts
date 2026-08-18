import type { UserComponent } from '../../../types';
import ComboChart from './ComboChart.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: ComboChart
};
