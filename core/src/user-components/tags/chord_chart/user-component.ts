import type { UserComponent } from '../../types';
import ChordChart from './ChordChart.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: ChordChart
};
