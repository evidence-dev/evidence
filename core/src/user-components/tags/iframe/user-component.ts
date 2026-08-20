import type { UserComponent } from '../../types';
import { schema } from './schema';
import IFrame from './IFrame.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: IFrame
};
