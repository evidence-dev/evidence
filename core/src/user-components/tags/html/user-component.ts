import type { UserComponent } from '../../types';
import Html from './Html.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Html
};
