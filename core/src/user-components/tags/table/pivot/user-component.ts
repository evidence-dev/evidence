import type { UserComponent } from '../../../types';
import { PivotModel } from './PivotModel.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Model: PivotModel
};
