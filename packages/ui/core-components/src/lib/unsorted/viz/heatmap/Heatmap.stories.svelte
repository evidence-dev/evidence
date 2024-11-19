<script context="module">
	import Heatmap from './Heatmap.svelte';

	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Viz/Heatmap',
		component: Heatmap
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	const data = Query.create(
		`
			select 0 as x, 0 as y, 100 as value
			union all
			select 1 as x, 0 as y, 200 as value
			union all
			select 0 as x, 1 as y, 300 as value
		`,
		query
	);
</script>

<Story name="All" let:args>
	<Heatmap {...args} {data} x="x" y="y" value="value" />
</Story>
