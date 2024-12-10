<script context="module">
	import Sparkline from './Sparkline.svelte';

	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Viz/Sparkline',
		component: Sparkline
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	const data = Query.create(`select fare, departure_date from flights limit 10`, query);
</script>

<Story name="All" let:args>
	<Sparkline {...args} {data} valueCol="fare" dateCol="departure_date" type="area" />
</Story>
