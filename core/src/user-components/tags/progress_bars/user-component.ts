import type { UserComponent } from '../../types';
import ProgressBars from './ProgressBars.svelte';
import { schema } from './schema';
import { ProgressBarsModel } from './ProgressBarsModel.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: ProgressBars,
	Model: ProgressBarsModel
};
