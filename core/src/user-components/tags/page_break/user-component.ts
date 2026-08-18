import type { UserComponent } from '../../types';
import PageBreak from './PageBreak.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: PageBreak
};
