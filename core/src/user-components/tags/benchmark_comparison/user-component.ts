import type { UserComponent } from '../../types';
import BenchmarkComparison from './BenchmarkComparison.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: BenchmarkComparison
};
