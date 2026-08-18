import type { UserComponent } from '../../types';
import Callout from './Callout.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Callout
};
