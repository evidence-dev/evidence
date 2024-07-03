<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Charts/BoxPlots',
		argTypes: {
			xHasGaps: {
				type: 'boolean',
				description: 'Determines if every series has every x value',
				defaultValue: false
			},
			yHasNulls: {
				type: 'boolean',
				description: 'Determines if y can have nulls',
				defaultValue: false
			},
			seriesAlwaysExists: {
				type: 'boolean',
				description: 'Determines if the series prop can be null',
				defaultValue: true
			},
			type: {
				type: 'string',
				options: ['stacked', 'grouped', 'stacked100'],
				control: { type: 'select' }
			}
		},
		args: {
			xHasGaps: false,
			yHasNulls: false,
			seriesAlwaysExists: true
		}
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';

	import BoxPlot from './BoxPlot.svelte';

	import { fakerSeries } from '$lib/faker-data-queries';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import DataTable from '../table/DataTable.svelte';
	const allFlights = Query.create(`SELECT * FROM numeric_series limit 500`, query);
	const flightData = Query.create(
		`
SELECT distinct_airlines.airline, MAX(fare) AS max_fare, MIN(fare) AS min_fare, MEDIAN(fare) AS median_fare
FROM flights
JOIN (
  SELECT DISTINCT airline
  FROM flights
  LIMIT 3
) AS distinct_airlines ON flights.airline = distinct_airlines.airline
GROUP BY distinct_airlines.airline
limit 500`,
		query
	);
</script>

<Template let:args>
	<BoxPlot
		{...args}
		intervalBottom="interval_bottom"
		midpoint="median"
		intervalTop="interval_top"
		data={flightData}
		yFmt="usd0"
	/>
</Template>

<Story name="Base" />

<Story name="test">
	<DataTable data={allFlights} />
	<DataTable data={flightData} />
	<BoxPlot
		data={flightData}
		name="airline"
		intervalBottom="min_fare"
		midpoint="median_fare"
		intervalTop="max_fare"
	/>
</Story>
