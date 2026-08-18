import { page } from '../../../shims/page-state';
import { Filters } from '../../../Filters.svelte';
import { getProjectSettingsContext } from '../../../project-settings.context';
import { getQueryService } from '../../../QueryService.context';
import { getContext, setContext, untrack } from 'svelte';

const REPEAT_CONTEXT_KEY = Symbol('REPEAT_CONTEXT');

export type RepeatContext = {
	filters: Filters;
};

export const getOrCreateRepeatContext = (): RepeatContext => {
	let context: RepeatContext = getContext(REPEAT_CONTEXT_KEY);
	if (!context) {
		// getContext only works during init, so hold the service and read its dialect lazily.
		const queryService = getQueryService();
		context = {
			filters: new Filters({
				url: () => untrack(() => page.url),
				updateUrl: undefined,
				projectSettings: getProjectSettingsContext(),
				dialect: () => queryService.dialect
			})
		};
		setContext(REPEAT_CONTEXT_KEY, context);
	}
	return context;
};

export const getRepeatContext = (): RepeatContext | undefined => getContext(REPEAT_CONTEXT_KEY);
