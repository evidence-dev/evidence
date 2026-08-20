import type { UserComponent } from '../../../../../types';
import ReferenceLine from './ReferenceLine.svelte';
import { schema } from './schema';

export const userComponent = {
	schema,
	Component: ReferenceLine
} as const satisfies UserComponent<typeof schema>;
