import type { UserComponent } from '../../../types';
import Area from './Area.svelte';
import { schema } from './schema';

export const userComponent = {
	schema,
	Component: Area
} as const satisfies UserComponent<typeof schema>;
