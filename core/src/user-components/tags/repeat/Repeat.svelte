<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { Query } from '../../../Query.svelte';
	import { getQueryService } from '../../../QueryService.context';
	import { getRepeatContext } from './repeat-context';
	import { processFilterIds } from '../../common/sql-options';
	import { flip } from 'svelte/animate';
	import { slide, fly } from 'svelte/transition';
	import RepeatChild from './RepeatChild.svelte';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { getProjectSettingsContext } from '../../../project-settings.context';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import { setupContainerReadiness } from '../../../readiness.svelte';
	import { getPrintModeContext } from '../../../print-mode.context';
	import {
		buildRepeatQueryConfig,
		resolveRepeatColumnExpression
	} from './build-repeat-query-config';

	const props: UserComponentProps<typeof schema> = $props();

	// Setup query infrastructure
	const queryService = getQueryService();
	const parentRepeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
	const inlineQueries = getInlineQueriesContext();

	// === VARIABLE INTERPOLATION ===
	const variableProcessor = $derived.by(() => {
		const filterContexts = [parentRepeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0 || !inlineQueries) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});

	const { resolveText, resolveColumn, resolveSql } = $derived(createResolvers(variableProcessor));

	// Resolved props
	const id = $derived(props.id);
	const data = $derived(resolveText(props.data));
	const column = $derived(
		resolveRepeatColumnExpression(props.column, resolveColumn, queryService.dialect)
	);
	const children = $derived(props.children);
	const filters = $derived(props.filters ?? []);
	const where = $derived(resolveSql(props.where));

	// Process filter conditions
	const filterConditions = $derived.by(() => {
		return processFilterIds(filters, [parentRepeatFilters, pageFilters], queryService.dialect);
	});

	const queryConfig = $derived.by(() => {
		if (!data || !column || !id) {
			return;
		}

		return buildRepeatQueryConfig({
			data,
			column,
			filterConditions,
			where,
			dialect: queryService.dialect
		});
	});
	const query = new Query(() => queryConfig, {
		queryService,
		filterContexts: [parentRepeatFilters, pageFilters],
		inlineQueries,
		projectSettings: getProjectSettingsContext(),
		defaultRefreshInterval: undefined
	});

	const printing = getPrintModeContext();

	// Container readiness: creates a child scope for descendants.
	// This task completes when BOTH:
	// 1. Repeat's own query has resolved (!loading)
	// 2. All children inside all RepeatChild iterations have completed their readiness
	setupContainerReadiness('repeat', () => !query.loading);

	// Get query results (kept for debugging)
	const queryResults = $derived(query.result?.rows ?? []);

	// Create items from query results with stable keys
	const items = $derived.by(() => {
		return queryResults.map((row, index) => ({
			value: row.value,
			index,
			// Create a stable key for each item using the value
			key: String(row.value)
		}));
	});
</script>

{#if children}
	{#each items as item (item.key)}
		<div
			in:slide={{ duration: printing ? 0 : 400 }}
			out:fly={{ x: -200, duration: printing ? 0 : 200 }}
			animate:flip={{ duration: printing ? 0 : 300 }}
		>
			<RepeatChild {id} value={item.value} {column} {children} />
		</div>
	{/each}
{:else}
	<div class="p-2 text-sm text-red-500">Repeat component has no children to render</div>
{/if}
