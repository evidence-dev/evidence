import type { UserComponent } from '../../../types';
import { schema } from './schema';
import PointLayer from './PointLayer.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: PointLayer
};
