import type { UserComponent } from '../../../types';
import Bar from './Bar.svelte';
import { schema } from './schema';

export const userComponent = {
	schema,
	Component: Bar
} as const satisfies UserComponent<typeof schema>;
