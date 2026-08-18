// TODO once we have a current project context, we can use that instead of this

import { DEFAULT_PAGE_SETTINGS, type PageSettings } from './user-components/interfaces/project-settings';
import { getContext, setContext } from 'svelte';

const PAGE_SETTINGS_CONTEXT_KEY = Symbol('PAGE_SETTINGS_CONTEXT');

export const setPageSettingsContext = (pageSettingsGetter: () => PageSettings) => {
	setContext(PAGE_SETTINGS_CONTEXT_KEY, pageSettingsGetter);
};

export const getPageSettingsContext = (): (() => PageSettings) => {
	const context = getContext<(() => PageSettings) | undefined>(PAGE_SETTINGS_CONTEXT_KEY);
	if (!context) {
		return () => DEFAULT_PAGE_SETTINGS;
	}
	return context;
};
