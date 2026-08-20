import type { UserComponent } from '../../types';
import Link from './Link.svelte';
import { schema } from './schema';

export const userComponent = {
	schema,
	Component: Link
} as const satisfies UserComponent<typeof schema>;
