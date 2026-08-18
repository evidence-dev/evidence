import type { UserComponent } from '../../../types';
import Else from './Else.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	Component: Else,
	schema
};
