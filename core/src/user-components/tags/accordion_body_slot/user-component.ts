import type { UserComponent } from '../../types';
import AccordionBodySlot from './AccordionBodySlot.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: AccordionBodySlot
};
