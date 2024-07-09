<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Charts/BubbleCharts'
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';
	import DataTable from '../../viz/table/DataTable.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import BubbleChart from './BubbleChart.svelte';
</script>

<Template let:args>
	{@const data = Query.create(
		'SELECT plane, fare, SUM(fare) as total_sales, SUM(distance) as total_distance FROM flights WHERE plane IN (SELECT DISTINCT plane FROM flights LIMIT 2) GROUP BY plane, fare LIMIT 25',
		query
	)}
	<DataTable {data} />
	<BubbleChart x="fare" y="total_distance" size="total_sales" {data} {...args} />
</Template>

<Story name="Base" />
<Story name="Series" args={{ series: 'plane' }} />
<Story name="Sort" args={{ series: 'plane', sort: false }} />
<Story name="Empty Set">
	{@const emptyData = []}
	<BubbleChart
		x="fare"
		y="total_distance"
		size="total_sales"
		data={emptyData}
		emptySet="warn"
		emptyMessage="data set is empty"
	/>
</Story>
