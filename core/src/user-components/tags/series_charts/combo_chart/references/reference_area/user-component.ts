import type { UserComponent } from '../../../../../types';
import ReferenceArea from './ReferenceArea.svelte';
import { schema } from './schema';

export const userComponent = {
	schema,
	Component: ReferenceArea
} as const satisfies UserComponent<typeof schema>;
