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

	import { fakerSeries } from '$lib/faker-data-queries.js';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
</script>

<Story name="Basic Usage">
	<TimeSeriesPanel data={fakerSeries.airlines.flights.store} name="BasicUsage" />
</Story>