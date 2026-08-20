import type { UserComponent } from '../../../types';
import Scatter from './Scatter.svelte';
import { schema } from './schema';

export const userComponent = {
	schema,
	Component: Scatter
} as const satisfies UserComponent<typeof schema>;
