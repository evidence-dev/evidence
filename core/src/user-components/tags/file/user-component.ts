import type { UserComponent } from '../../types';
import FileAttachment from './FileAttachment.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: FileAttachment
};
