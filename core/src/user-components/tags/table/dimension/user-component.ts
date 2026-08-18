import type { UserComponent } from '../../../types';
import { DimensionModel } from './DimensionModel.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Model: DimensionModel
};
