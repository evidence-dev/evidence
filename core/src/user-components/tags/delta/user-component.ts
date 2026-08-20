import type { UserComponent } from '../../types';
import { schema } from './schema';
import Delta from './Delta.svelte';
import { DeltaModel } from './DeltaModel.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Delta,
	Model: DeltaModel
};
