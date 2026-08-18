import type { UserComponent } from '../../types';
import CandlestickChart from './CandlestickChart.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: CandlestickChart
};
