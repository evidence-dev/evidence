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
	const data = Query.create(`SELECT * from flights`, query);
	const flightData = Query.create(
		`
SELECT 
    airline, 
    MAX(fare) AS max_fare, 
    MIN(COALESCE(fare, 0)) AS min_fare, 
    MEDIAN(fare) AS median_fare,
		MAX(fare)-500 AS intervalTop_fare,
		MIN(fare)+500 AS intervalBottom_fare,

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
		intervalBottom="min_fare"
		midpoint="median_fare"
		intervalTop="max_fare"
		title="Flights"
	/>
</Template>

<Story name="Base" />

<Story name="swapXY=true colors">
	<DataTable data={data} />
	<BoxPlot
		data={flightData}
		name="airline"
		intervalBottom="intervalBottom_fare"
		midpoint="median_fare"
		intervalTop="intervalTop_fare"
		swapXY="true"
		color="color"
		title="Flights: swapXY=true, colors"
	/>
</Story>

<Story name="whiskers">
	<DataTable data={flightData} />
	<BoxPlot
		data={flightData}
		name="airline"
		intervalBottom="intervalBottom_fare"
		midpoint="median_fare"
		intervalTop="intervalTop_fare"
		max="max_fare"
		min="min_fare"
		title="Flights: whiskers"
	/>
</Story>
