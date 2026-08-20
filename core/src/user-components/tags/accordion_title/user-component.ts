import type { UserComponent } from '../../types';
import AccordionTitle from './AccordionTitle.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: AccordionTitle
};
