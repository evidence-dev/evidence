import type { UserComponent } from '../../../types';
import If from './If.svelte';
import { schema } from './schema';
import { IfModel } from './IfModel.svelte';

export const userComponent: UserComponent<typeof schema> = {
	Component: If,
	schema,
	Model: IfModel
};
