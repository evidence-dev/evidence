import type { UserComponent } from '../../types';
import Repeat from './Repeat.svelte';
import { RepeatFilter } from './RepeatFilter.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Repeat,
	Filter: RepeatFilter
};
