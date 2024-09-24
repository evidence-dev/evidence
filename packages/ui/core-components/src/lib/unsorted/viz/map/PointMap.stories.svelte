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
	const null_grouped_locations = Query.create(
		`SELECT 
		*, 
		CASE 
			WHEN id BETWEEN 0 AND 4 THEN 'Hotels'
			WHEN id BETWEEN 5 AND 9 THEN 'Restaurants'
			WHEN id BETWEEN 10 AND 14 THEN 'Golf Courses'
			WHEN id BETWEEN 15 AND 19 THEN 'Shops'
			WHEN id BETWEEN 20 AND 24 THEN 'Bars'
			WHEN id BETWEEN 25 AND 29 THEN 'Entertainment'
			END AS Category
	FROM la_locations`,
		query
	);

	const cybersan_grouped_locations = Query.create(
		`SELECT 
		*, 
		CASE 
			WHEN id BETWEEN 0 AND 4 THEN 1
			WHEN id BETWEEN 5 AND 9 THEN 2
			WHEN id BETWEEN 10 AND 14 THEN 3
			WHEN id BETWEEN 15 AND 19 THEN 4
			WHEN id BETWEEN 20 AND 24 THEN 5
			WHEN id BETWEEN 25 AND 29 THEN 6
			WHEN id BETWEEN 26 AND 34 THEN 7
			END AS legendID
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

<Story name="Legend Usage" parameters={{ chromatic: { disableSnapshot: true } }}>
	<PointMap
		legendType="category"
		legendPosition="bottomLeft"
		data={grouped_locations}
		lat="lat"
		long="long"
		value="Category"
		colorPalette={['orange', 'yellow', 'brown']}
		tooltipType="hover"
		tooltip={[
			{ id: 'point_name', showColumnName: false, valueClass: 'text-lg font-semibold' },
			{ id: 'sales', fmt: 'usd', fieldClass: 'text-[grey]', valueClass: 'text-[green]' }
		]}
	/>
	<div class="h-32"></div>
	<PointMap
		data={grouped_locations}
		legendType="scalar"
		lat="lat"
		long="long"
		value="sales"
		colorPalette={['red', 'blue', 'green']}
		tooltipType="hover"
		tooltip={[
			{ id: 'point_name', showColumnName: false, valueClass: 'text-lg font-semibold' },
			{ id: 'sales', fmt: 'usd', fieldClass: 'text-[grey]', valueClass: 'text-[green]' }
		]}
	/>
	<div class="h-32"></div>
</Story>

<Story name="Legend Usage w/ null values" parameters={{ chromatic: { disableSnapshot: true } }}>
	<PointMap
		legendType="category"
		legendPosition="bottomLeft"
		data={null_grouped_locations}
		lat="lat"
		long="long"
		value="Category"
		colorPalette={['orange', 'yellow', 'brown']}
		tooltipType="hover"
		tooltip={[
			{ id: 'point_name', showColumnName: false, valueClass: 'text-lg font-semibold' },
			{ id: 'sales', fmt: 'usd', fieldClass: 'text-[grey]', valueClass: 'text-[green]' }
		]}
	/>
	<div class="h-32"></div>
	<PointMap
		data={grouped_locations}
		legendType="scalar"
		lat="lat"
		long="long"
		value="sales"
		colorPalette={['red', 'blue', 'green']}
		tooltipType="hover"
		tooltip={[
			{ id: 'point_name', showColumnName: false, valueClass: 'text-lg font-semibold' },
			{ id: 'sales', fmt: 'usd', fieldClass: 'text-[grey]', valueClass: 'text-[green]' }
		]}
	/>
</Story>

<Story name="Cybersan point maps" parameters={{ chromatic: { disableSnapshot: true } }}>
	<PointMap
		data={cybersan_grouped_locations}
		lat="lat"
		long="long"
		value="legendID"
		colorPalette={['red', 'green', 'blue', 'orange', 'yellow', 'brown', 'purple']}
		tooltipType="hover"
		tooltip={[
			{ id: 'point_name', showColumnName: false, valueClass: 'text-lg font-semibold' },
			{ id: 'sales', fmt: 'usd', fieldClass: 'text-[grey]', valueClass: 'text-[green]' }
		]}
	/>
	<div class="h-32"></div>
</Story>
