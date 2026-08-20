import type { UserComponent } from '../../types';
import AccordionItem from './AccordionItem.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: AccordionItem
};
