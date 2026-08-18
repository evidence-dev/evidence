import type { UserComponent } from '../../types';
import Modal from './Modal.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Modal
};
