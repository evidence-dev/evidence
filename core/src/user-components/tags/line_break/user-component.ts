import type { UserComponent } from '../../types';
import LineBreak from './LineBreak.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: LineBreak
};
