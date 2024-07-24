<script context="module">
	import TimeSeriesPanel from './TimeSeriesPanel.svelte';
	import Metric from './Metric.svelte';
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
	greatest(200,count(*)*power(1.001,row_number() OVER ())) as ARR, 
	count(*)-100*power(1.002,row_number() OVER ()) as WAU, 
	count(*)*power(1.004,row_number() OVER ()) as "Cloud WAU", 
	count(*)-100*power(1.001,row_number() OVER ()) as "Week 4 Retention", 
	count(*)*power(1.009,row_number() OVER ()) as "GH Stars"
FROM series_demo_source.flights group by all
	`;
</script>

<Story name="Basic Usage">
	<TimeSeriesPanel
		data={Query.create(queryString, query, { disableCache: true })}
		metrics={['arr', 'wau', 'cloud_wau', 'week_4_retention', 'gh_stars']}
	>
		<Metric
			metric="greatest(200,count(*)*power(1.001,row_number() OVER ()))"
			label="ARR"
			link="http://www.google.com"
		/>
		<Metric
			metric="greatest(200,count(*)*power(1.001,row_number() OVER ()))"
			label="WAU"
			link="http://www.google.com"
		/>
		<Metric
			metric="greatest(200,count(*)*power(1.001,row_number() OVER ()))"
			label="Cloud WAU"
			link="http://www.google.com"
		/>
		<Metric
			metric="greatest(200,count(*)*power(1.001,row_number() OVER ()))"
			label="Week 4 Retention"
			link="http://www.google.com"
		/>
		<Metric
			metric="greatest(200,count(*)*power(1.001,row_number() OVER ()))"
			label="GH Stars"
			link="http://www.google.com"
		/>
	</TimeSeriesPanel>
</Story>
