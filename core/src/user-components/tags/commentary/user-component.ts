import type { UserComponent } from '../../types';
import Commentary from './Commentary.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Commentary
};
