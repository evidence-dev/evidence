import type { UserComponent } from '../../types';
import RangeCalendar from './RangeCalendar.svelte';
import { schema } from './schema';
import { RangeCalendarFilter } from './RangeCalendarFilter.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: RangeCalendar,
	Filter: RangeCalendarFilter
};
