import type { UserComponent } from '../../types';
import TargetComparison from './TargetComparison.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: TargetComparison
};
