import type { UserComponent } from '../../types';
import { schema } from './schema';
import ButtonGroup from './ButtonGroup.svelte';
import { ButtonGroupFilter } from './ButtonGroupFilter.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: ButtonGroup,
	Filter: ButtonGroupFilter
};
