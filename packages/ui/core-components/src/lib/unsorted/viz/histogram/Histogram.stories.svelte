<script context="module">
	import Histogram from './Histogram.svelte';

	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Viz/Histogram',
		component: Histogram
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	const data = Query.create(
		`
			select 1 as x
			union all
			select 2 as x
			union all
			select 3 as x
			union all
			select 4 as x
			union all
			select 5 as x
			union all
			select 6 as x
			union all
			select 7 as x
			union all
			select 8 as x
		`,
		query
	);
</script>

<Story name="All" let:args>
	<Histogram {...args} {data} x="x" />
</Story>
