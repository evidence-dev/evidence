import type { UserComponent } from '../../types';
import Option from '../option/Option.svelte';
import { schema } from './schema';

// Backwards compatibility alias - re-export the Option component as dropdown_option
export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Option
};
