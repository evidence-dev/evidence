import type { UserComponent } from '../../types';
import { schema } from './schema';
import Logo from './Logo.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Logo
};
