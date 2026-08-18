import type { UserComponent } from '../../types';
import CustomMap from './CustomMap.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: CustomMap
};
