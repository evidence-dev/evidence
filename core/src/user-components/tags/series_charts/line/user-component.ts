import type { UserComponent } from '../../../types';
import Line from './Line.svelte';
import { schema } from './schema';

export const userComponent = {
	schema,
	Component: Line
} as const satisfies UserComponent<typeof schema>;
