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
	import { within, userEvent, expect } from '@storybook/test';

	let queryString = `
	  SELECT
	    departure_date::date as date,
	  FROM series_demo_source.flights
			`;
	// let queryString = `
	// SELECT
	// 	departure_date::date as date,
	// 	greatest(200,count(*)*power(1.001,row_number() OVER ())) as ARR,
	// 	count(*)-100*power(1.002,row_number() OVER ()) as WAU,
	// 	count(*)*power(1.004,row_number() OVER ()) as "Cloud WAU",
	// 	count(*)-100*power(1.001,row_number() OVER ()) as "Week 4 Retention",
	// 	count(*)*power(1.009,row_number() OVER ()) as "GH Stars"
	// FROM series_demo_source.flights group by all
	// 	`;
</script>

<Story name="Basic Usage">
	<TimeSeriesPanel
		data={Query.create(queryString, query, { disableCache: true })}
		x="date"
		fmt="num0"
		defaultTimeRange="1m"
	>
		<Metric
			metric="greatest(200,count(*)*power(1.001,row_number() OVER ()))"
			label="ARR"
			link="http://www.google.com"
			fmt="usd2"
		/>
		<Metric
			metric="count(*)-100*power(1.002,row_number() OVER ())"
			label="WAU"
			link="http://www.google.com"
			fmt="num0"
		/>
		<Metric
			metric="count(*)*power(1.004,row_number() OVER ())"
			label="Cloud WAU"
			link="http://www.google.com"
		/>
		<Metric
			metric="count(*)-100*power(1.001,row_number() OVER ())"
			label="Week 4 Retention"
			link="http://www.google.com"
			fmt="num0"
		/>
		<Metric
			metric="count(*)*power(1.009,row_number() OVER ())"
			label="GH Stars"
			link="http://www.google.com"
			fmt="num2"
		/>
	</TimeSeriesPanel>
</Story>

<Story
	name="Interaction"
	play={async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const thirdMetric = await canvas.findByText('Cloud WAU');
		await userEvent.click(thirdMetric);

		// Check if the third metric is now selected
		const selectedMetric = await canvas.findByText('Cloud WAU', {
			selector: '.font-bold.text-gray-700'
		});
		expect(selectedMetric).toBeTruthy();

		// Change the time range
		const timeRangeButton = await canvas.findByText('1M');
		await userEvent.click(timeRangeButton);

		// Test tooltip functionality
		const chart = await canvas.findByTestId('time-series-chart');
		await userEvent.hover(chart);
	}}
>
	<TimeSeriesPanel
		data={Query.create(queryString, query, { disableCache: true })}
		metrics={['arr', 'wau', 'cloud_wau', 'week_4_retention', 'gh_stars']}
		x="date"
	>
		<Metric
			metric="greatest(200,count(*)*power(1.001,row_number() OVER ()))"
			label="ARR"
			link="http://www.google.com"
		/>
		<Metric
			metric="count(*)-100*power(1.002,row_number() OVER ())"
			label="WAU"
			link="http://www.google.com"
		/>
		<Metric
			metric="count(*)*power(1.004,row_number() OVER ())"
			label="Cloud WAU"
			link="http://www.google.com"
		/>
		<Metric
			metric="count(*)-100*power(1.001,row_number() OVER ())"
			label="Week 4 Retention"
			link="http://www.google.com"
		/>
		<Metric
			metric="count(*)*power(1.009,row_number() OVER ())"
			label="GH Stars"
			link="http://www.google.com"
		/>
	</TimeSeriesPanel>
</Story>

<Story name="Declining Value">
	<TimeSeriesPanel
		data={Query.create(queryString, query, { disableCache: true })}
		metrics={['arr', 'wau', 'cloud_wau', 'week_4_retention', 'gh_stars']}
		x="date"
	>
		<Metric metric="kyle wong" label="WAU" link="http://www.google.com" />
		<Metric
			metric="greatest(100, 1000 * power(0.995, row_number() OVER ()))"
			label="ARR"
			link="http://www.google.com"
		/>
		<Metric
			metric="count(*)*power(1.004,row_number() OVER ())"
			label="Cloud WAU"
			link="http://www.google.com"
		/>
		<Metric
			metric="count(*)-100*power(1.001,row_number() OVER ())"
			label="Week 4 Retention"
			link="http://www.google.com"
		/>
		<Metric
			metric="count(*)*power(1.009,row_number() OVER ())"
			label="GH Stars"
			link="http://www.google.com"
		/>
	</TimeSeriesPanel>
</Story>

<!-- <Story name="TEST">
	{@const data = Query.create(
		`SELECT departure_date::date as date, fare from flights LIMIT 1000`,
		query
	)}

	<DataTable {data} />
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
</Story> -->
