<script context="module">
	import DimensionGrid from './DimensionGrid.svelte';
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		component: DimensionGrid,
		argTypes: [],
		title: 'Charts/DimensionGrid'
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';

	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import { userEvent, within } from '@storybook/test';

	const data = Query.create('select * from flights', query);
	const dataSmallColumn = Query.create('select plane, airline, seat from flights', query);

	const dataPlay = Query.create('select plane, airline from flights', query);

	const nullComboData = Query.create('select * from flights limit 1000', query);

	let storyIframeURL = '';

	const updateURL = () => {
		storyIframeURL = window.location.href;

		// Try forcing Storybook to recognize the change
		const iframe = document.querySelector('iframe');
		if (iframe) {
			iframe.src = iframe.src; // Force reload
		}
	};

	(function () {
		const pushState = history.pushState;
		const replaceState = history.replaceState;

		history.pushState = function () {
			pushState.apply(history, arguments);
			updateURL();
		};

		history.replaceState = function () {
			replaceState.apply(history, arguments);
			updateURL();
		};

		window.addEventListener('popstate', updateURL);
	})();
</script>

<Story name="Basic Usage">
	<DimensionGrid {data} name="BasicUsage" />
</Story>

<Story name="Named as an Input">
	<DimensionGrid name="dimensiongrid" {data} />
</Story>
<Story name="small column">
	<DimensionGrid name="dimensiongrid" data={dataSmallColumn} />
</Story>

<Story name="Labelled Metric">
	<DimensionGrid {data} metricLabel="Flights" />
</Story>

<Story name="Labelled Metric with Long Label">
	<DimensionGrid {data} metricLabel="A very long metric label that I cooked up for this purpose" />
</Story>

<Story name="Limit 15">
	<DimensionGrid limit="15" {data} />
</Story>

<Story name="Limit 0">
	<DimensionGrid limit="0" {data} />
</Story>

<Story name="Custom metric">
	<DimensionGrid metric="sum(fare) + 308" {data} />
</Story>

<Story name="Custom Format">
	<DimensionGrid {data} fmt="eur" />
</Story>

<Story name="Negative Values">
	<DimensionGrid metric="count(*) -5000" {data} />
</Story>

<Story name="Null Metric Values">
	<DimensionGrid metric="sum(fare)/0" {data} />
</Story>

<Story name="Null Metric Values, Custom Format">
	<DimensionGrid metric="sum(fare)/0" {data} fmt="usd" />
</Story>

<Story name="Null Dimension Values">
	<DimensionGrid
		data={Query.create(
			"SELECT case when fare > 500 then 'Big Fare!!' else null end as nullable_string_column, * FROM series_demo_source.flights",
			query,
			{ disableCache: true }
		)}
	/>
</Story>

<Story name="Invalid Metric">
	<DimensionGrid metric="specialsum(fare)" {data} />
</Story>

<Story name="No Data Prop">
	<DimensionGrid />
</Story>

<Story name="String Data Prop">
	<DimensionGrid data="my_query" />
</Story>

<Story name="Empty Data">
	<DimensionGrid
		data={Query.create('SELECT * FROM series_demo_source.flights limit 0', query, {
			disableCache: true
		})}
	/>
</Story>

<Story name="SQL Error in Data">
	<DimensionGrid
		data={Query.create('SELECT does_not_exist FROM series_demo_source.flights limit 0', query, {
			disableCache: true
		})}
	/>
</Story>

<Story name="No String Columns">
	<DimensionGrid
		data={Query.create('SELECT fare FROM series_demo_source.flights limit 10', query, {
			disableCache: true
		})}
	/>
</Story>

<Story name="Null Metric Values Multiple">
	<DimensionGrid metric="sum(fare)/0" {data} />
</Story>

<Story name="Null Dimension Values Multiple">
	<DimensionGrid
		multiple
		data={Query.create(
			"SELECT case when fare > 500 then 'Big Fare!!' else null end as nullable_string_column, * FROM series_demo_source.flights",
			query,
			{ disableCache: true }
		)}
	/>
</Story>

<Story
	name="Filtering in one column"
	play={async ({ canvasElement }) => {
		await data.fetch();
		const screen = within(canvasElement);

		const row = await screen.findByText('Virgin Atlantic Airways');
		await userEvent.click(row);
	}}
>
	<DimensionGrid data={dataPlay} />
</Story>

<Story
	name="Filtering in multiple columns"
	play={async ({ canvasElement }) => {
		await data.fetch();
		const screen = within(canvasElement);

		const airline = await screen.findByText('Virgin Atlantic Airways');
		await userEvent.click(airline);

		const plane = await screen.findByText('Boeing 787');
		await userEvent.click(plane);
	}}
>
	<DimensionGrid data={dataPlay} />
</Story>
<Story
	name="Selecting Multiple Values in single column"
	play={async ({ canvasElement }) => {
		await data.fetch();
		const screen = within(canvasElement);

		const airline = await screen.findByText('Virgin Atlantic Airways');
		await userEvent.click(airline);

		const airline2 = await screen.findByText('Finnair');
		await userEvent.click(airline2);
	}}
>
	<DimensionGrid data={dataPlay} multiple />
</Story>
<Story
	name="Selecting Multiple Values in Multiple Columns"
	play={async ({ canvasElement }) => {
		await data.fetch();
		const screen = within(canvasElement);

		const airline = await screen.findByText('Virgin Atlantic Airways');
		await userEvent.click(airline);

		const plane = await screen.findByText('Boeing 717');
		await userEvent.click(plane);

		const airline2 = await screen.findByText('Korean Air');
		await userEvent.click(airline2);

		const plane2 = await screen.findByText('Airbus A320');
		await userEvent.click(plane2);
	}}
>
	<DimensionGrid data={dataPlay} multiple />
</Story>
<Story
	name="Deselecting Multiple Values in Multiple Columns"
	play={async ({ canvasElement }) => {
		await data.fetch();
		const screen = within(canvasElement);

		const airline = await screen.findByText('Virgin Atlantic Airways');
		await userEvent.click(airline);

		await userEvent.click(airline);

		const plane = await screen.findByText('Boeing 787');
		await userEvent.click(plane);

		await userEvent.click(plane);
	}}
>
	<DimensionGrid data={dataPlay} multiple />
</Story>

<Story
	name="Null Row Column Combination"
	play={async ({ canvasElement }) => {
		await data.fetch();
		const screen = within(canvasElement);

		const plane = await screen.findByText('Boeing 727');
		await userEvent.click(plane);

		const plane2 = await screen.findByText('Airbus A320');
		await userEvent.click(plane2);

		const airline = await screen.findByText('Flydubai');
		await userEvent.click(airline);
	}}
>
	<DimensionGrid data={nullComboData} multiple />
</Story>

<Story
	name="Null Row Column Combination, Custom Format"
	play={async ({ canvasElement }) => {
		await data.fetch();
		const screen = within(canvasElement);

		const plane = await screen.findByText('Boeing 727');
		await userEvent.click(plane);

		const plane2 = await screen.findByText('Airbus A320');
		await userEvent.click(plane2);

		const airline = await screen.findByText('Flydubai');
		await userEvent.click(airline);
	}}
>
	<DimensionGrid data={nullComboData} multiple fmt="usd" />
</Story>
<Story name="URL Params">
	<DimensionGrid {data} name="urlParams" />
	<div class="mt-4">URL: {storyIframeURL}</div>
	<button
		class="mt-4 p-1 border bg-info/60 hover:bg-info/40 active:bg-info/20 rounded-md text-sm

	"
		on:click={() => window.open(storyIframeURL, '_blank')}>Go to URL</button
	>
</Story>
<Story name="URL Params Multiple">
	<DimensionGrid {data} multiple name="urlParamsMultiple" />
	<div class="mt-4">URL: {storyIframeURL}</div>
	<button
		class="mt-4 p-1 border bg-info/60 hover:bg-info/40 active:bg-info/20 rounded-md text-sm

	"
		on:click={() => window.open(storyIframeURL, '_blank')}>Go to URL</button
	>
</Story>
