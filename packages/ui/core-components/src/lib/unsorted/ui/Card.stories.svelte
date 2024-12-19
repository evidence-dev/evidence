<script context="module">
	import Card from './Card.svelte';

	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'UI/Card',
		component: Card
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	import BarChart from '../viz/bar/BarChart.svelte';
</script>

<Story name="All" args={{ x: 'x', y: 'y', series: 'series' }} let:args>
	{@const data = Query.create(`select * from numeric_series`, query)}
	<Card>
		<BarChart {data} {...args} />
	</Card>
</Story>
