import { schema } from './schema';
import CalendarHeatmap from './CalendarHeatmap.svelte';
import type { UserComponent } from '../../types';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: CalendarHeatmap
};
