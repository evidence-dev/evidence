import type { UserComponent } from '../../types';
import Details from './Details.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Details
};
