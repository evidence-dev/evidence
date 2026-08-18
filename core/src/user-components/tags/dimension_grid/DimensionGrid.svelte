<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { Query } from '../../../Query.svelte';
	import { getQueryService } from '../../../QueryService.context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getQueryInfoContext } from '../../../query-info-context.svelte';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import { processFilterIds } from '../../common/sql-options';
	import { processDateRange } from '../../common/date-options';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { setupRenderReadiness } from '../../../readiness.svelte';
	import { getProjectSettingsContext } from '../../../project-settings.context';
	import { DEFAULT_PROJECT_SETTINGS } from '../../interfaces/project-settings';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import { extract } from 'runed';
	import { getMetadataContext } from '../../../metadata/context';
	import { getInlineQueryMetadataContext } from '../../../metadata/inline-query-metadata.svelte';
	import DimensionCut, { type DimensionQueryRow } from './DimensionCut.svelte';
	import { setDimensionGridContext } from './dimension-grid-context';
	import type { DimensionGridFilter } from './DimensionGridFilter.svelte';
	import { Label } from '../../../shadcn/components/ui/label';
	import { escapeSqlValue } from '../../../sql-dialect';
	import { buildDimensionGridQuery } from './build-dimension-grid-sql';
	import { untrack } from 'svelte';

	const props: UserComponentProps<typeof schema> = $props();

	const { getComponentId, hasBlockingErrors, setError } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();

	const queryService = getQueryService();
	const repeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
	const inlineQueries = getInlineQueriesContext();
	const projectSettings = getProjectSettingsContext();

	// Metadata contexts for dimension auto-detection
	let metadata: ReturnType<typeof getMetadataContext> | undefined;
	let inlineQueryMetadata: ReturnType<typeof getInlineQueryMetadataContext> | undefined;

	try {
		metadata = getMetadataContext();
	} catch {
		// Context may not be available
	}

	try {
		inlineQueryMetadata = getInlineQueryMetadataContext();
	} catch {
		// Context may not be available
	}

	// Variable interpolation
	const variableProcessor = $derived.by(() => {
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0 || !inlineQueries) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});

	const { resolveText, resolveSql } = $derived(createResolvers(variableProcessor));

	// Resolved props
	const id = $derived(props.id);
	const table = $derived(resolveText(props.data));
	const tableExpression = $derived.by(() => {
		if (!table) return '';
		if (inlineQueries) {
			try {
				return inlineQueries.getInterpolated(table, queryService.dialect) ?? table;
			} catch {
				return table;
			}
		}
		return table;
	});
	const explicitDimensions = $derived(props.dimensions);
	const metric = $derived(resolveSql(props.metric) ?? 'count(*)');
	const metricLabel = $derived(resolveText(props.metric_label));
	const fmt = $derived(resolveText(props.fmt));
	const limit = $derived(props.limit ?? 10);
	const filterIds = $derived(props.filters);
	const multiple = $derived(props.multiple ?? true);
	const title = $derived(resolveText(props.title));
	const subtitle = $derived(resolveText(props.subtitle));
	const where = $derived(resolveSql(props.where));
	const resolvedDateRange = $derived.by(() => {
		if (!props.date_range) return undefined;
		return {
			...props.date_range,
			range: resolveText(props.date_range.range)
		};
	});

	// Get filter instance
	let filter: DimensionGridFilter | undefined = $derived(
		id ? (pageFilters?.get(id) as DimensionGridFilter | undefined) : undefined
	);

	const hasValidationErrors = $derived(hasBlockingErrors());

	// Auto-detect dimensions from metadata if not explicitly provided
	const detectedDimensions = $derived.by(() => {
		if (explicitDimensions && Array.isArray(explicitDimensions) && explicitDimensions.length > 0) {
			return explicitDimensions.filter((d): d is string => typeof d === 'string');
		}

		if (!table) return [];

		// Try to get columns from metadata
		const tableMetadata = metadata?.getTable(table) ?? inlineQueryMetadata?.getTable(table);
		if (!tableMetadata) return [];

		// Find string columns (jsType contains 'string')
		const stringColumns = tableMetadata.columns
			.filter((col) => col.jsType.toLowerCase().includes('string'))
			.map((col) => col.name)
			.slice(0, 5); // Limit to 5 dimensions by default

		return stringColumns;
	});

	// Update filter attributes with detected dimensions
	$effect(() => {
		if (filter && detectedDimensions.length > 0) {
			untrack(() => {
				filter!.attributes._dimensionColumns = detectedDimensions;
			});
		}
	});

	// Build base WHERE clause (shared across all dimension queries)
	const baseWhereClause = $derived.by(() => {
		const conditions: string[] = [];

		// Add external filter SQL from filterIds
		const filterSql = processFilterIds(filterIds, [repeatFilters, pageFilters]);
		if (filterSql) conditions.push(`(${filterSql})`);

		// Add user's WHERE clause
		if (where) conditions.push(`(${where})`);

		// Add date range filter
		if (
			resolvedDateRange &&
			resolvedDateRange.range &&
			resolvedDateRange.range !== 'all time'
		) {
			const settings = extract(projectSettings, DEFAULT_PROJECT_SETTINGS);
			const processed = processDateRange(
				resolvedDateRange.range,
				resolvedDateRange.date,
				new Date(),
				settings.first_day_of_week,
				queryService.dialect
			);
			if (processed.whereClause) conditions.push(`(${processed.whereClause})`);
		}

		return conditions.length > 0 ? conditions.join(' AND ') : undefined;
	});

	// Build cross-filter WHERE clause from OTHER dimensions' selections
	function getCrossFilterClause(excludeDimension: string): string | undefined {
		if (!filter?.value) return undefined;

		const conditions: string[] = [];

		for (const [dim, values] of Object.entries(filter.value)) {
			// Skip the dimension we're querying for
			if (dim === excludeDimension) continue;
			// Keys come from a URL param, so only detected dimensions may reach the SQL.
			if (!detectedDimensions.includes(dim)) continue;

			const valuesArray = Array.isArray(values) ? values : [values];
			if (valuesArray.length === 0) continue;

			// Check for null values (represented as empty string or special marker)
			const hasNull = valuesArray.some((v) => v === '' || v === null);
			const nonNullValues = valuesArray.filter((v) => v !== '' && v !== null);

			const parts: string[] = [];
			if (nonNullValues.length > 0) {
				const escaped = nonNullValues
					.map((v) => `'${escapeSqlValue(String(v), queryService.dialect)}'`)
					.join(', ');
				parts.push(`${dim} IN (${escaped})`);
			}
			if (hasNull) {
				parts.push(`${dim} IS NULL`);
			}

			if (parts.length > 0) {
				conditions.push(`(${parts.join(' OR ')})`);
			}
		}

		return conditions.length > 0 ? conditions.join(' AND ') : undefined;
	}

	// Build SQL query for a single dimension
	function buildDimensionQuery(dimension: string): string | undefined {
		if (!table || !tableExpression || hasValidationErrors) return undefined;

		return buildDimensionGridQuery({
			tableExpression,
			dimension,
			metric,
			limit,
			baseWhereClause,
			crossFilterClause: getCrossFilterClause(dimension),
			selectedValues: filter?.getDimensionValue(dimension) ?? [],
			dialect: queryService.dialect
		});
	}

	// Create queries for each dimension
	// We store the queries in a reactive map that updates when dimensions change
	type DimensionQueryInfo = {
		query: Query<DimensionQueryRow>;
		dimension: string;
	};

	let dimensionQueryInfos: DimensionQueryInfo[] = $state([]);

	// Update queries when dimensions change
	$effect(() => {
		if (hasValidationErrors || !table || detectedDimensions.length === 0) {
			dimensionQueryInfos = [];
			return;
		}

		// Create new query instances for each dimension
		const newQueryInfos: DimensionQueryInfo[] = detectedDimensions.map((dimension) => {
			const query = new Query<DimensionQueryRow>(() => buildDimensionQuery(dimension), {
				queryService,
				filterContexts: [repeatFilters, pageFilters],
				inlineQueries,
				projectSettings,
				defaultRefreshInterval: undefined
			});
			return { query, dimension };
		});

		dimensionQueryInfos = newQueryInfos;
	});

	// Combine SQL from all dimension queries for display in ComponentConsole
	const combinedSql = $derived.by(() => {
		const parts = dimensionQueryInfos.flatMap(({ query, dimension }) =>
			query.sql ? [{ sql: query.sql, dimension }] : []
		);

		if (parts.length === 0) return undefined;
		if (parts.length === 1) return parts[0].sql;

		return parts.map((p) => `-- dimension: ${p.dimension}\n${p.sql.trimEnd()};`).join('\n\n');
	});

	// Merge per-dimension results so the console and page-level export see every dimension,
	// not just the last one registered
	const combinedQueryResult = $derived.by(() => {
		const withRows = dimensionQueryInfos.filter(({ query }) => query.result?.rows?.length);

		return {
			rows: withRows.flatMap(({ query, dimension }) =>
				(query.result?.rows ?? []).map((row) => ({ dimension, ...row }))
			),
			columns:
				withRows.length > 0
					? [{ name: 'dimension', jsType: 'string' }, ...(withRows[0].query.result?.columns ?? [])]
					: [],
			error: queryErrors.length > 0 ? queryErrors.join('\n') : undefined
		};
	});

	// Register queries with query info context
	$effect(() => {
		if (!queryInfoContext || dimensionQueryInfos.length === 0) return;

		if (dimensionQueryInfos.length === 1) {
			const { query, dimension } = dimensionQueryInfos[0];
			return queryInfoContext.registerQuery(
				componentId,
				'dimension_grid',
				query,
				`${title ?? 'Dimension Grid'} - ${dimension}`
			);
		}

		const combinedQuery = {
			result: combinedQueryResult,
			loading: loading,
			sql: combinedSql
		} as unknown as Parameters<typeof queryInfoContext.registerQuery>[2];

		return queryInfoContext.registerQuery(componentId, 'dimension_grid', combinedQuery, title);
	});

	// Loading state - true if any dimension query is loading
	const loading = $derived(dimensionQueryInfos.some(({ query }) => query.loading));

	// Error handling - collect errors from all queries
	const queryErrors = $derived.by(() => {
		const errors: string[] = [];
		for (const { query, dimension } of dimensionQueryInfos) {
			if (query.error) {
				errors.push(`${dimension}: ${query.error}`);
			}
		}
		return errors;
	});

	$effect(() => {
		if (queryErrors.length > 0) {
			setError(queryErrors.join('; '));
		} else {
			setError(undefined);
		}
	});

	setupRenderReadiness('dimension_grid', () => !loading);

	// Context for child components
	setDimensionGridContext({
		filter,
		multiple,
		fmt,
		metricLabel
	});

	// Handle selection toggle
	function handleToggle(dimension: string, value: string) {
		filter?.toggleValue(dimension, value, multiple);
	}

	// Handle clear for a dimension
	function handleClear(dimension: string) {
		filter?.clearDimension(dimension);
	}
</script>

{#if title || subtitle}
	<div class="mb-3">
		{#if title}
			<Label class="text-base font-medium">{title}</Label>
		{/if}
		{#if subtitle}
			<p class="text-muted-foreground text-sm">{subtitle}</p>
		{/if}
	</div>
{/if}

{#if filter && detectedDimensions.length > 0}
	<div class="no-scrollbar flex flex-nowrap overflow-auto select-none sm:flex-wrap">
		{#each dimensionQueryInfos as { query, dimension } (dimension)}
			<DimensionCut
				{dimension}
				rows={query.result?.rows ?? []}
				selectedValues={filter.getDimensionValue(dimension)}
				{metricLabel}
				{fmt}
				onToggle={(value) => handleToggle(dimension, value)}
				onClear={() => handleClear(dimension)}
			/>
		{/each}
	</div>
{:else if !filter}
	<div class="text-muted-foreground text-sm">
		Filter not registered. Ensure the component has an id.
	</div>
{:else}
	<div class="text-muted-foreground text-sm">
		No dimensions detected. Provide explicit dimensions or ensure the table has string columns.
	</div>
{/if}
