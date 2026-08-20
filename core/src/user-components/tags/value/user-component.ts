import type { UserComponent } from '../../types';
import Value from './Value.svelte';
import { schema } from './schema';
import { ValueModel } from './ValueModel.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Value,
	Model: ValueModel
};
