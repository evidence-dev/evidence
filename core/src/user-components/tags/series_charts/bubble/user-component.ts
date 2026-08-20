import type { UserComponent } from '../../../types';
import Bubble from './Bubble.svelte';
import { schema } from './schema';

export const userComponent = {
	schema,
	Component: Bubble
} as const satisfies UserComponent<typeof schema>;
