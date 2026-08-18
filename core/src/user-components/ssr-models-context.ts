import { deserializeTree } from './Renderer/MarkdocProcessor/tree-serialization';
import { getQueryService } from '../QueryService.context';
import { getPageFiltersContext } from '../page-filters-context';
import { getInlineQueriesContext } from './common/inline-queries';
import { getMetricsCatalogContext } from '../metrics/metrics-catalog';
import { getProjectSettingsContext } from '../project-settings.context';
import { page } from '../shims/page-state';
import { getContext, setContext } from 'svelte';
import type { QueryDependencies } from '../Query.svelte';
import { createModelsFromTree, type ModelsByTagId } from './createModelsFromTree';

const SSR_MODELS_CONTEXT_KEY = Symbol('SSR_MODELS_CONTEXT');

export const setupSSRModelsContext = (): void => {
	const serializedTree = page.data.serializedTree;
	const serializedModels = page.data.serializedModels;
	if (!serializedTree || !serializedModels) return;

	const tree = deserializeTree(serializedTree);
	const validationErrors = page.data.validationErrors ?? [];

	const queryService = getQueryService();
	const repeatFilters = undefined; // TODO how to incorporate this? Without it, repeat doesn't work during SSR
	const pageFilters = getPageFiltersContext();
	const inlineQueries = getInlineQueriesContext();
	const metricsCatalog = getMetricsCatalogContext();
	const getProjectSettings = getProjectSettingsContext();
	const deps: QueryDependencies = {
		queryService,
		filterContexts: [repeatFilters, pageFilters],
		inlineQueries,
		projectSettings: getProjectSettings,
		defaultRefreshInterval: undefined
	};

	const context = createModelsFromTree(
		tree,
		validationErrors,
		deps,
		serializedModels,
		metricsCatalog
	);

	setContext(SSR_MODELS_CONTEXT_KEY, context);
};

export const getSSRModelsContext = (): ModelsByTagId | undefined => {
	return getContext<ModelsByTagId | undefined>(SSR_MODELS_CONTEXT_KEY);
};
