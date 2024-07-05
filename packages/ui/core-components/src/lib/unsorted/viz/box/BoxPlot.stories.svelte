<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Charts/BoxPlots'
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';

	import BoxPlot from './BoxPlot.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import DataTable from '../table/DataTable.svelte';
	const flightData = Query.create(
		`
SELECT 
    airline, 
    MAX(distance) AS max_distance, 
    MIN(COALESCE(distance, 0)) AS min_distance, 
    MEDIAN(distance) AS median_distance,
    CASE 
        WHEN airline = 'Qatar Airways' THEN 'red' 
        WHEN airline = 'AirAsia' THEN 'blue' 
        ELSE 'gray' 
    END AS color
FROM flights
WHERE airline IN ('Qatar Airways', 'AirAsia')
GROUP BY airline, color
limit 50`,
		query
	);
</script>

<Template>
	<BoxPlot
		data={flightData}
		name="airline"
		intervalBottom="min_distance"
		midpoint="median_distance"
		intervalTop="max_distance"
	/>
</Template>

<Story name="Base" />

<Story name="swapXY=true">
	<DataTable data={flightData} />
	<BoxPlot
		data={flightData}
		name="airline"
		intervalBottom="min_distance"
		midpoint="median_distance"
		intervalTop="max_distance"
		swapXY="true"
		color="color"
	/>
</Story>
