<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Charts/AreaCharts',
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

	import AreaChart from './AreaChart.svelte';

	import { fakerSeries } from '$lib/faker-data-queries';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import DataTable from '../table/DataTable.svelte';
	const flightData = Query.create(`SELECT * from flights LIMIT 100`, query);
	const planeData = Query.create(
		`
SELECT f.departure_date, SUM(f.fare) AS total_fare, CONCAT('https://www.google.com/search?q=', ANY_VALUE(f.plane)) as plane_url, f.plane
FROM (
    SELECT DISTINCT plane
    FROM flights
    LIMIT 2
) p
JOIN flights f ON p.plane = f.plane
GROUP BY f.departure_date, f.plane
LIMIT 200`,
		query
	);
</script>

<Template let:args>
	<AreaChart
		{...args}
		x="x"
		y="y"
		series="series"
		data={fakerSeries['numeric_series'][args.xHasGaps][args.yHasNulls][args.seriesAlwaysExists]
			.store}
	/>
</Template>

<Story name="Base" />

<Story name="With Link">
	<DataTable data={planeData} />
	<AreaChart
		data={planeData}
		x="departure_date"
		y="total_fare"
		link="plane_url"
		series="plane"
		xFmt="date"
		yFmt="usd0"
	/>
</Story>

<Story name="With steps, fmt and labels">
	<DataTable data={flightData} />
	<AreaChart
		data={flightData}
		x="distance"
		y="fare"
		yFmt="usd0"
		step="true"
		labels="true"
		labelFmt="usd0"
	/>
	<AreaChart data={flightData} x="distance" y="fare" yFmt="usd0" step="false" />
</Story>
