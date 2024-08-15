<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Charts/Maps/PointMap',
		component: PointMap
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	import PointMap from './PointMap.svelte';

	/** @type {typeof query} */
	const slowQuery = async (...args) => {
		await new Promise((resolve) => setTimeout(resolve, 5_000));
		return query(...args);
	};

	const la_locations = Query.create(`select * from la_locations order by 1`, query);

	const slow_la_locations = Query.create(
		`select * from la_locations order by 1 limit 100`,
		slowQuery
	);
</script>

<Story name="Basic Usage" parameters={{ chromatic: { disableSnapshot: true } }}>
	<PointMap data={la_locations} lat="lat" long="long" />
</Story>

<Story name="Loading" parameters={{ chromatic: { disableSnapshot: true } }}>
	<PointMap data={slow_la_locations} lat="lat" long="long" />
</Story>
