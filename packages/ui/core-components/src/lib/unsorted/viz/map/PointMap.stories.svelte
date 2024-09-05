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
	import DataTable from '../../viz/table/DataTable.svelte';

	import PointMap from './PointMap.svelte';

	/** @type {typeof query} */
	const slowQuery = async (...args) => {
		await new Promise((resolve) => setTimeout(resolve, 5_000));
		return query(...args);
	};

	const la_locations = Query.create(`select * from la_locations order by 1`, query);
	const grouped_locations = Query.create(
		`SELECT 
  *, 
  CASE 
    WHEN id BETWEEN 0 AND 9 THEN 1
    WHEN id BETWEEN 10 AND 19 THEN 2
    WHEN id BETWEEN 20 AND 29 THEN 3
    WHEN id BETWEEN 30 AND 39 THEN 4
  END AS legend_id
FROM la_locations`,
		query
	);

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

<Story name="legend Usage" parameters={{ chromatic: { disableSnapshot: true } }}>
	<DataTable data={grouped_locations} />
	<PointMap
		data={grouped_locations}
		lat="lat"
		long="long"
		value="legend_id"
		colorPalette={['green', 'blue', 'red', 'yellow']}
		tooltipType="hover"
		tooltip={[
			{ id: 'point_name', showColumnName: false, valueClass: 'text-lg font-semibold' },
			{ id: 'sales', fmt: 'usd', fieldClass: 'text-[grey]', valueClass: 'text-[green]' }
		]}
	/>
</Story>
