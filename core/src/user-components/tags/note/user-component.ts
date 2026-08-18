import type { UserComponent } from '../../types';
import Note from './Note.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Note
};
