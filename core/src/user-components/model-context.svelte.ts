import type {
	WithDefaults,
	UserComponentModel,
	UserComponentModelClass
} from './UserComponentModel';
import { getContext, setContext } from 'svelte';
import { getConnectionRegistry } from '../connection';
import { connectionErrorFor } from '../connection/enforcement';
import { connectionForAttributes } from './common/connection-for-attributes';
import { getPageFiltersContext } from '../page-filters-context';
import { getInlineQueriesContext } from './common/inline-queries';
import { getMetricsCatalogContext } from '../metrics/metrics-catalog';
import type { QueryDependencies } from '../Query.svelte';
import { getSSRModelsContext } from './ssr-models-context';
import { getRepeatContext } from './tags/repeat/repeat-context';
import type { ValidateError } from '@markdoc/markdoc';
import { getProjectSettingsContext } from '../project-settings.context';
import { logger } from '../shims/logger';
import { getAutoRefreshContext } from '../auto-refresh.context.svelte';

const MODEL_CONTEXT_KEY = Symbol('MODEL_CONTEXT');

export const setupModelContext = <
	Attributes extends Record<string, unknown>,
	Model extends UserComponentModelClass<WithDefaults<{ Attributes: Attributes }>>
>(
	tagId: string,
	attributesGetter: () => Attributes,
	validationErrorsGetter: () => ValidateError[],
	ModelClass: Model
): void => {
	try {
		// Try to get SSR model first
		const ssrModelsContext = getSSRModelsContext();
		let model: UserComponentModel | undefined = ssrModelsContext?.[tagId];

		// If the model wasn't SSRed, create it now
		if (!model) {
			const repeatFilters = getRepeatContext()?.filters;
			const pageFilters = getPageFiltersContext();
			const inlineQueries = getInlineQueriesContext();
			const metricsCatalog = getMetricsCatalogContext();
			const getProjectSettings = getProjectSettingsContext();
			const autoRefresh = getAutoRefreshContext();
			// Route this component to the connection its `data`/reference names — the default when it
			// names none. Registry captured here because `getContext` is only legal during setup; the
			// `$derived` recomputes on inline-query churn but only NOTIFIES when the resolved
			// connection actually changes, so the query re-runs only when its engine truly does. Inert
			// with a single connection: an unqualified reference always resolves to the default, and
			// `connectionError` stands down until connection names are registered.
			const registry = getConnectionRegistry();
			const targetConnection = $derived(connectionForAttributes(attributesGetter(), inlineQueries));
			const routedConnection = $derived(registry.get(targetConnection));
			const deps: QueryDependencies = {
				get connection() {
					return routedConnection;
				},
				filterContexts: [repeatFilters, pageFilters],
				inlineQueries,
				projectSettings: getProjectSettings,
				defaultRefreshInterval: autoRefresh ? () => autoRefresh.intervalSeconds : undefined,
				connectionError: () => connectionErrorFor(targetConnection, inlineQueries)
			};

			// Get this Tag's parent model if it exists (it would have been set up by a previous call to setupModelContext by the parent)
			const parent = getModelContext({ allowUndefined: true }) ?? null;

			model = new ModelClass({
				attributes: attributesGetter,
				validationErrors: validationErrorsGetter,
				parent,
				deps,
				metricsCatalog
			}) as UserComponentModel;

			if (parent) {
				$effect(() => {
					const removeChild = parent.addChild(model!);
					return removeChild;
				});
			}
		}

		setContext(MODEL_CONTEXT_KEY, model);
	} catch (e) {
		logger.error(e, 'Failed to set up model context');
	}
};

type GetModelOptions<
	Expected extends UserComponentModelClass | undefined,
	AllowUndefined extends boolean | undefined
> = {
	expected?: Expected;
	allowUndefined?: AllowUndefined;
};

type GetModelReturn<
	Expected extends UserComponentModelClass | undefined,
	AllowUndefined extends boolean | undefined
> = Expected extends UserComponentModelClass
	? AllowUndefined extends true
		? InstanceType<Expected> | undefined
		: InstanceType<Expected>
	: AllowUndefined extends true
		? UserComponentModel | undefined
		: UserComponentModel;

// Implementation
export const getModelContext = <
	Expected extends UserComponentModelClass | undefined = undefined,
	AllowUndefined extends boolean | undefined = undefined
>(
	options: GetModelOptions<Expected, AllowUndefined> = {}
): GetModelReturn<Expected, AllowUndefined> => {
	const model = getContext<UserComponentModel | undefined>(MODEL_CONTEXT_KEY);

	// Handle undefined context
	if (!model && !options?.allowUndefined) {
		throw new Error('Model Context not set!');
	}

	// Handle expected narrowing
	if (options?.expected && model && !(model instanceof options.expected)) {
		throw new Error(
			`Model Context doesn't match expected class. Found: ${model.constructor.name}, Expected: ${options.expected.name}`
		);
	}

	return model as GetModelReturn<Expected, AllowUndefined>;
};
