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

	let queryString = `
SELECT 
	departure_date::date as date, 
	greatest(200,count(*)*power(1.001,row_number() OVER ())) as arr, 
	count(*)-100*power(1.002,row_number() OVER ()) as wau, 
	count(*)*power(1.001,row_number() OVER ()) as cloud_wau, 
	count(*)-100*power(1.001,row_number() OVER ()) as week_4_retention, 
	count(*)*power(1.001,row_number() OVER ()) as gh_stars
FROM series_demo_source.flights group by all
	`
</script>

<Story name="Basic Usage">
	<TimeSeriesPanel
		data={Query.create(
			queryString, 
			query,
			{ disableCache: true }
		)}
		metrics={['arr', 'wau', 'cloud_wau', 'week_4_retention', 'gh_stars']}
	/>
</Story>
