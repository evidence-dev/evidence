import type { UserComponent } from '../../types';
import Slider from './Slider.svelte';
import { SliderFilter } from './SliderFilter.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Slider,
	Filter: SliderFilter
};
