<script lang="ts">
	import { getQueryService } from '../../../../../../QueryService.context';
	import { getRepeatContext } from '../../../../repeat/repeat-context';
	import { Query } from '../../../../../../Query.svelte';
	import { processColumnExpression } from '../../../../../common/sql-expression-utils';
	import { getRowValue } from '../getRowValue';
	import ReferencePointStatic from './ReferencePointStatic.svelte';
	import type { ReferencePointDynamicProps } from './types';
	import { getPageFiltersContext } from '../../../../../../page-filters-context';
	import { getInlineQueriesContext } from '../../../../../common/inline-queries';
	import { getProjectSettingsContext } from '../../../../../../project-settings.context';

	const props: ReferencePointDynamicProps = $props();
	const data = $derived(props.data);
	const label = $derived(props.label);
	const x = $derived(props.x);
	const y = $derived(props.y);

	const queryService = getQueryService();
	const repeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
	const inlineQueries = getInlineQueriesContext();

	// Convert columns to processed column expressions
	const processedColumns = $derived.by(() => {
		const columns = [];
		if (x) columns.push(processColumnExpression({ value: x }, queryService.dialect));
		if (y) columns.push(processColumnExpression({ value: y }, queryService.dialect));
		if (label) columns.push(processColumnExpression({ value: label }, queryService.dialect));
		return columns;
	});

	const queryConfig = $derived.by(() => {
		if (processedColumns.length === 0) return;

		return {
			tableExpressionName: data,
			columns: processedColumns
		};
	});
	const query = new Query(() => queryConfig, {
		queryService,
		filterContexts: [repeatFilters, pageFilters],
		inlineQueries,
		projectSettings: getProjectSettingsContext(),
		defaultRefreshInterval: undefined
	});

	const rows = $derived(query.result?.rows ?? []);

	const labelAxis = $derived.by(() => {
		const isX = label === x;
		const isY = label === y;
		if (isX) return 'x';
		if (isY) return 'y';
		return undefined;
	});
</script>

{#each rows as row}
	{@const x_value = getRowValue(row, x)}
	{@const y_value = getRowValue(row, y)}
	{#if typeof x_value !== 'undefined' && typeof y_value !== 'undefined'}
		<ReferencePointStatic
			{...props}
			label={getRowValue(row, label)?.toString()}
			x={x_value}
			y={y_value}
			{labelAxis}
		/>
	{/if}
{/each}
