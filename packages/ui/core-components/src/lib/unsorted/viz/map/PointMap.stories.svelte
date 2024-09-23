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
    WHEN id BETWEEN 0 AND 4 THEN 'Hotels'
    WHEN id BETWEEN 5 AND 9 THEN 'Restaurants'
    WHEN id BETWEEN 10 AND 14 THEN 'Golf Courses'
    WHEN id BETWEEN 15 AND 19 THEN 'Shops'
    WHEN id BETWEEN 20 AND 24 THEN 'Bars'
    WHEN id BETWEEN 25 AND 29 THEN 'Entertainment'
    WHEN id BETWEEN 30 AND 34 THEN 'Banks'
  END AS Category
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
		showLegend={true}
		legendPosition="bottomLeft"
		data={grouped_locations}
		lat="lat"
		long="long"
		value="Category"
		colorPalette={['#243c5a', '#ff5733', '#005733']}
		tooltipType="hover"
		tooltip={[
			{ id: 'point_name', showColumnName: false, valueClass: 'text-lg font-semibold' },
			{ id: 'sales', fmt: 'usd', fieldClass: 'text-[grey]', valueClass: 'text-[green]' }
		]}
	/>
	<div class="h-32"></div>
</Story>
