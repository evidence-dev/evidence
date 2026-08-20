import type { UserComponent } from '../../types';
import Accordion from './Accordion.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Accordion
};
