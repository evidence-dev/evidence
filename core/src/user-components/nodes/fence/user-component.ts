import type { UserComponent } from '../../types';
import Fence from './Fence.svelte';
import { schema } from './schema';

export const userComponent = {
	schema,
	Component: Fence
} satisfies UserComponent<typeof schema>;
