import type { UserComponent } from '../../types';
import Treemap from './Treemap.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Treemap
};
