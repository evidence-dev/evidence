import type { UserComponent } from '../../types';
import TextInput from './TextInput.svelte';
import { TextInputFilter } from './TextInputFilter.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: TextInput,
	Filter: TextInputFilter
};
