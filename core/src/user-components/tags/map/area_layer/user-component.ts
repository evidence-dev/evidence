import type { UserComponent } from '../../../types';
import { schema } from './schema';
import AreaLayer from './AreaLayer.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: AreaLayer
};
