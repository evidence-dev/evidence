import type { UserComponent } from '../../types';
import Histogram from './Histogram.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Histogram
};

export { schema };
export type {
	HistogramProps,
	HistogramUserProps,
	HistogramInternalProps
} from './Histogram.svelte';
