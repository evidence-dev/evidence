import type { UserComponent } from '../../types';
import HiddenInPrint from './HiddenInPrint.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: HiddenInPrint
};
