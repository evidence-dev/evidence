import type { UserComponent } from '../../types';
import Conditional from './Conditional.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Conditional
};
