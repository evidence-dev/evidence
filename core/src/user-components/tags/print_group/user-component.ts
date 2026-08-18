import type { UserComponent } from '../../types';
import PrintGroup from './PrintGroup.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: PrintGroup
};
