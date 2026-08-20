import type { UserComponent } from '../../types';
import Info from './Info.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Info
};
