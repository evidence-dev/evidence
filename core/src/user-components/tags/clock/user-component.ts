import type { UserComponent } from '../../types';
import Clock from './Clock.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Clock
};
