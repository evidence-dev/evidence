import type { UserComponent } from '../../../../../types';
import ReferencePoint from './ReferencePoint.svelte';
import { schema } from './schema';

export const userComponent = {
	schema,
	Component: ReferencePoint
} as const satisfies UserComponent<typeof schema>;
