import type { UserComponent } from '../../types';
import { schema } from './schema';
import MetricCard from './MetricCard.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: MetricCard
};
