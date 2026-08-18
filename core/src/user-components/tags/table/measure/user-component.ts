import type { UserComponent } from '../../../types';
import { MeasureModel } from './MeasureModel.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Model: MeasureModel
};
