import type { UserComponent } from '../../types';
import Audio from './Audio.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Audio
};
