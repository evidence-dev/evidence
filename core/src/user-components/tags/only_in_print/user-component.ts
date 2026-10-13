import type { UserComponent } from '../../types';
import OnlyInPrint from './OnlyInPrint.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: OnlyInPrint
};
