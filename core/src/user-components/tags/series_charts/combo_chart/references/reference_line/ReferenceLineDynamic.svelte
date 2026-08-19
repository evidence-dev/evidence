<script lang="ts">
	import { Query } from '../../../../../../Query.svelte';
	import { getDefaultConnection } from '../../../../../../QueryService.context';
	import { getRepeatContext } from '../../../../repeat/repeat-context';
	import { processColumnExpression } from '../../../../../common/sql-expression-utils';
	import ReferenceLineStatic from './ReferenceLineStatic.svelte';
	import { getRowValue } from '../getRowValue';
	import type { ReferenceLineDynamicProps } from './types';
	import { getPageFiltersContext } from '../../../../../../page-filters-context';
	import { getInlineQueriesContext } from '../../../../../common/inline-queries';
	import { getProjectSettingsContext } from '../../../../../../project-settings.context';
	import { getComboChartContext } from '../../combo-chart-context';

	const props: ReferenceLineDynamicProps = $props();
	const data = $derived(props.data);
	const label = $derived(props.label);
	const x = $derived(props.x);
	const y = $derived(props.y);
	const x1 = $derived(props.x1);
	const y1 = $derived(props.y1);
	const x2 = $derived(props.x2);
	const y2 = $derived(props.y2);

	const connection = getDefaultConnection();
	const repeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
	const inlineQueries = getInlineQueriesContext();

	// Convert columns to processed column expressions
	const processedColumns = $derived.by(() => {
		const columns = [];
		if (x) columns.push(processColumnExpression({ value: x }, connection.dialect));
		if (y) columns.push(processColumnExpression({ value: y }, connection.dialect));
		if (x1) columns.push(processColumnExpression({ value: x1 }, connection.dialect));
		if (y1) columns.push(processColumnExpression({ value: y1 }, connection.dialect));
		if (x2) columns.push(processColumnExpression({ value: x2 }, connection.dialect));
		if (y2) columns.push(processColumnExpression({ value: y2 }, connection.dialect));
		if (label) columns.push(processColumnExpression({ value: label }, connection.dialect));
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

	const MAX_ROWS = 100;
	const rows = $derived(query.result?.rows ?? []);
	const limitedRows = $derived(rows.slice(0, MAX_ROWS));

	const { registerChildError } = getComboChartContext();
	$effect(() => registerChildError(() => query.error));
</script>

{#each limitedRows as row}
	<ReferenceLineStatic
		{...props}
		label={getRowValue(row, label)?.toString()}
		x={getRowValue(row, x)}
		y={getRowValue(row, y)}
		x1={getRowValue(row, x1)}
		y1={getRowValue(row, y1)}
		x2={getRowValue(row, x2)}
		y2={getRowValue(row, y2)}
	/>
{/each}
