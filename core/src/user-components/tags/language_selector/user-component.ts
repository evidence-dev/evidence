import type { UserComponent } from '../../types';
import { schema } from './schema';
import LanguageSelector from './LanguageSelector.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: LanguageSelector
};
