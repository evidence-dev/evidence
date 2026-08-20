<script lang="ts">
	import { setQueryService } from '@evidence/core/QueryService.context';
	import { setProjectSettingsContext } from '@evidence/core/project-settings.context';
	import { setPageSettingsContext } from '@evidence/core/page-settings.context';
	import { setAutoRefreshContext } from '@evidence/core/auto-refresh.context.svelte';
	import type {
		PageSettings,
		ProjectSettings
	} from '@evidence/core/user-components/interfaces/project-settings';
	import { createPageFiltersContext } from '@evidence/core/page-filters-context';
	import {
		createInlineQueriesContext,
		type SqlFiles
	} from '@evidence/core/user-components/common/inline-queries';
	import { setPageState } from '@evidence/core/shims/page-state';
	import { setShowErrorsContext } from '@evidence/core/show-errors.context';
	import { Metadata, setMetadataContext } from '@evidence/core/metadata';
	import {
		InlineQueryMetadata,
		setInlineQueryMetadataContext
	} from '@evidence/core/metadata/inline-query-metadata.svelte';
	import { createMetricsCatalogContext } from '@evidence/core/metrics/metrics-catalog';
	import { CLIQueryService, type ConnectionType } from '$lib/services/CLIQueryService';
	import type { Snippet } from 'svelte';
	import type { SerializedFilters } from '@evidence/core/Filters.svelte';

	interface Props {
		organizationId?: string;
		connectionType?: ConnectionType;
		serializedInlineQueries?: Record<string, string>;
		serializedFilters?: SerializedFilters;
		sqlFiles?: SqlFiles;
		basePath?: string;
		useRelativeResolution?: boolean;
		/** metrics/*.yaml discovered from the project root, keyed by path. */
		metricFiles?: Record<string, string>;
		pageSettings?: PageSettings;
		projectSettings?: ProjectSettings & { computedDefaultDateRangeEnd?: string };
		children: Snippet;
	}

	let {
		organizationId = '',
		connectionType = null,
		serializedInlineQueries = {},
		serializedFilters = {},
		sqlFiles = {},
		basePath,
		useRelativeResolution = false,
		metricFiles = {},
		pageSettings = {},
		projectSettings = { first_day_of_week: 'sunday' },
		children
	}: Props = $props();

	// Set page state shim for CLI context
	setPageState({
		route: { id: '/cli' },
		url:
			typeof window !== 'undefined' ? new URL(window.location.href) : new URL('http://localhost'),
		params: {},
		data: {},
		status: 200,
		error: null,
		form: null
	});

	// Show validation error overlays on components
	setShowErrorsContext(true);

	// Create and set QueryService with the right dialect for the active connection.
	const queryService = new CLIQueryService(organizationId, connectionType);
	setQueryService(queryService);

	// Set up metadata so components that introspect tables/columns work.
	// connectionType values match WarehouseMode names 1:1; null → managed engine.
	const metadata = new Metadata(queryService, {
		warehouseMode: connectionType ?? 'managed'
	});
	setMetadataContext(metadata);

	// Project settings come from evidence.config `date:`; page settings from the
	// page's frontmatter (layered over the project `layout:` defaults server-side).
	setProjectSettingsContext(() => projectSettings);
	setPageSettingsContext(() => pageSettings);
	setAutoRefreshContext(() => pageSettings);

	// Create filter and inline query contexts
	// Pass serialized filters so they're deserialized and available to components
	// Pass SQL files so they can be referenced as data sources
	const pageFilters = createPageFiltersContext(serializedFilters);
	const inlineQueries = createInlineQueriesContext(
		{ filterContexts: [pageFilters] },
		serializedInlineQueries,
		sqlFiles,
		undefined,
		{ basePath, useRelativeResolution }
	);

	// Inline query metadata context (required by table_filter, dimension_grid)
	const inlineQueryMetadata = new InlineQueryMetadata(queryService, {
		inlineQueries,
		pageFilters
	});
	setInlineQueryMetadataContext(inlineQueryMetadata);

	// Semantic-metrics catalog so `metric="..."` refs resolve. Empty map for
	// projects without a `metrics/` folder — the create call is cheap and any
	// components that don't use metrics never touch it.
	const metricsCatalog = createMetricsCatalogContext(metricFiles);
	$effect(() => {
		metricsCatalog.setFromYaml(metricFiles);
	});

	$effect(() => {
		inlineQueryMetadata.loadAllDebounced();
	});
</script>

{@render children()}
