import type { UserComponent } from '../../types';
import Sparkline from './Sparkline.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Sparkline
};
