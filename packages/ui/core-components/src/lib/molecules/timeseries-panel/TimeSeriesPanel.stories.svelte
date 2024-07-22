<script context="module">
	import TimeSeriesPanel from './TimeSeriesPanel.svelte';
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		component: TimeSeriesPanel,
		argTypes: [],
		title: 'Charts/TimeSeriesPanel'
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
</script>

<Story name="Basic Usage">
	<TimeSeriesPanel
		data={Query.create(
			'SELECT departure_date::date as date, count(*)*power(1.001,row_number() OVER ()) as growing_value, count(*)-100*power(1.001,row_number() OVER ()) as declining_value FROM series_demo_source.flights group by all ',
			query,
			{ disableCache: true }
		)}
		name="BasicUsage"
	/>
</Story>
