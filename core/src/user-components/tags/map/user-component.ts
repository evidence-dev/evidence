import type { UserComponent } from '../../types';
import { schema } from './schema';
import Map from './Map.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Map
};
