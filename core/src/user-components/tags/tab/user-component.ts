import type { UserComponent } from '../../types';
import Tab from './Tab.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Tab
};
