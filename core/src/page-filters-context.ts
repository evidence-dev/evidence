import { getContext, setContext, untrack } from 'svelte';
import { Filters, type SerializedFilters } from './Filters.svelte';
import { getProjectSettingsContext } from './project-settings.context';
import { getDefaultConnection } from './connection';

export const PAGE_FILTERS_CONTEXT_KEY = Symbol('PAGE_FILTERS_CONTEXT');

export const createPageFiltersContext = (
	serializedFilters: SerializedFilters = {},
	opts?: { url?: () => URL; updateUrl?: (url: URL) => void }
): Filters => {
	// getContext only works during init, so hold the connection and read its dialect lazily.
	const connection = getDefaultConnection();
	const context = new Filters(
		{
			url: opts?.url ? () => untrack(() => opts.url!()) : undefined,
			updateUrl: opts?.updateUrl,
			projectSettings: getProjectSettingsContext(),
			dialect: () => connection.dialect
		},
		serializedFilters
	);
	setContext(PAGE_FILTERS_CONTEXT_KEY, context);
	return context;
};

export const getPageFiltersContext = (): Filters | undefined => {
	return getContext<Filters | undefined>(PAGE_FILTERS_CONTEXT_KEY);
};
