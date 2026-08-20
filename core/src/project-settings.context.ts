import { DEFAULT_PROJECT_SETTINGS, type ProjectSettings } from './user-components/interfaces/project-settings';
import { getContext, setContext } from 'svelte';

const PROJECT_SETTINGS_CONTEXT_KEY = Symbol('PROJECT_SETTINGS_CONTEXT');

export const setProjectSettingsContext = (
	projectSettingsGetter: () => ProjectSettings & { computedDefaultDateRangeEnd?: string }
) => {
	setContext(PROJECT_SETTINGS_CONTEXT_KEY, projectSettingsGetter);
};

export const getProjectSettingsContext = (): (() => ProjectSettings & {
	computedDefaultDateRangeEnd?: string;
}) => {
	const context = getContext<
		(() => ProjectSettings & { computedDefaultDateRangeEnd?: string }) | undefined
	>(PROJECT_SETTINGS_CONTEXT_KEY);
	if (!context) {
		return () => DEFAULT_PROJECT_SETTINGS;
	}
	return context;
};
