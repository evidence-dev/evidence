import type { UserComponent } from '../../types';
import Tabs from './Tabs.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Tabs
};
