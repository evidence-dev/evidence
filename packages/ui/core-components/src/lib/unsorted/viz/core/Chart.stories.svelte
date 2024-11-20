<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Charts/Chart',
		component: Chart
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import Chart from './Chart.svelte';
	import Bar from '../bar/Bar.svelte';
	import Line from '../line/Line.svelte';
</script>

<Story name="Base">
	{@const data = Query.create(
		`SELECT 1 AS x, 5 AS growth, 50 AS size, 0.1 AS seriesA, 0.7 AS seriesB
UNION
SELECT 2 AS x, 10 AS growth, 60 AS size, 0.1 AS seriesA, 0.7 AS seriesB
UNION
SELECT 3 AS x, 20 AS growth, 70 AS size, 0.1 AS seriesA, 0.7 AS seriesB
UNION
SELECT 4 AS x, 30 AS growth, 90 AS size, 0.1 AS seriesA, 0.7 AS seriesB
UNION
SELECT 5 AS x, 40 AS growth, 110 AS size, 0.1 AS seriesA, 0.7 AS seriesB
UNION
SELECT 6 AS x, 50 AS growth, 130 AS size, 0.1 AS seriesA, 0.7 AS seriesB`,
		query
	)}
	<Chart {data} title="Growth vs Sales">
		<Bar y="growth" series="seriesA" seriesLabelFmt="pct" />
		<Line y="size" series="seriesB" seriesLabelFmt="pct" />
	</Chart>
</Story>
