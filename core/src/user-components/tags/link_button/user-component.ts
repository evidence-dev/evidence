import type { UserComponent } from '../../types';
import LinkButton from './LinkButton.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: LinkButton
};
