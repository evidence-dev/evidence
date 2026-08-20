import type { UserComponent } from '../../types';
import Option from './Option.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Option
};
