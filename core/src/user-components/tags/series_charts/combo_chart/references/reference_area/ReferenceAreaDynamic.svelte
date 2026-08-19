<script lang="ts">
	import { getDefaultConnection } from '../../../../../../QueryService.context';
	import { getRepeatContext } from '../../../../repeat/repeat-context';
	import { Query } from '../../../../../../Query.svelte';
	import { processColumnExpression } from '../../../../../common/sql-expression-utils';
	import { getRowValue } from '../getRowValue';
	import ReferenceAreaStatic from './ReferenceAreaStatic.svelte';
	import type { ReferenceAreaDynamicProps } from './types';
	import { getPageFiltersContext } from '../../../../../../page-filters-context';
	import { getInlineQueriesContext } from '../../../../../common/inline-queries';
	import { getProjectSettingsContext } from '../../../../../../project-settings.context';
	import { getComboChartContext } from '../../combo-chart-context';

	const props: ReferenceAreaDynamicProps = $props();
	const data = $derived(props.data);
	const label = $derived(props.label);
	const x_min = $derived(props.x_min);
	const x_max = $derived(props.x_max);
	const y_min = $derived(props.y_min);
	const y_max = $derived(props.y_max);

	const connection = getDefaultConnection();
	const repeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
	const inlineQueries = getInlineQueriesContext();

	// Convert columns to processed column expressions
	const processedColumns = $derived.by(() => {
		const columns = [];
		if (label) columns.push(processColumnExpression({ value: label }, connection.dialect));
		if (x_min) columns.push(processColumnExpression({ value: x_min }, connection.dialect));
		if (x_max) columns.push(processColumnExpression({ value: x_max }, connection.dialect));
		if (y_min) columns.push(processColumnExpression({ value: y_min }, connection.dialect));
		if (y_max) columns.push(processColumnExpression({ value: y_max }, connection.dialect));
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
		connection,
		filterContexts: [repeatFilters, pageFilters],
		inlineQueries,
		projectSettings: getProjectSettingsContext(),
		defaultRefreshInterval: undefined
	});

	const rows = $derived(query.result?.rows ?? []);

	const { registerChildError } = getComboChartContext();
	$effect(() => registerChildError(() => query.error));
</script>

{#each rows as row}
	<ReferenceAreaStatic
		{...props}
		label={getRowValue(row, label)?.toString()}
		x_min={getRowValue(row, x_min)}
		x_max={getRowValue(row, x_max)}
		y_min={getRowValue(row, y_min)}
		y_max={getRowValue(row, y_max)}
	/>
{/each}
