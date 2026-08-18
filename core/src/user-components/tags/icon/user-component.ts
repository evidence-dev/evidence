import type { UserComponent } from '../../types';
import Icon from './Icon.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Icon
};
