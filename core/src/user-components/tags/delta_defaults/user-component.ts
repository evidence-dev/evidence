import type { UserComponent } from '../../types';
import { schema } from './schema';
import DeltaDefaults from './DeltaDefaults.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: DeltaDefaults
};
