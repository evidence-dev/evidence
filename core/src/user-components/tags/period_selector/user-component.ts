import type { UserComponent } from '../../types';
import { schema } from './schema';
import PeriodSelector from './PeriodSelector.svelte';
import { PeriodFilter } from '../workflow_period/PeriodFilter.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: PeriodSelector,
	Filter: PeriodFilter
};
