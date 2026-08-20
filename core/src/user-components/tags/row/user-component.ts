import type { UserComponent } from '../../types';
import Row from './Row.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Row
};
