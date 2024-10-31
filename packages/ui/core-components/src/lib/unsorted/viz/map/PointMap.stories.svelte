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
			WHEN id BETWEEN 25 AND 29 THEN 'Entertainment And Nightlife'
			END AS Category
	FROM la_locations`,
		query
	);

	const number_category_grouped_locations = Query.create(
		`SELECT 
		*, 
	CASE 
    WHEN id BETWEEN 0 AND 2 THEN 1
    WHEN id BETWEEN 3 AND 5 THEN 2
    WHEN id BETWEEN 6 AND 8 THEN 3
    WHEN id BETWEEN 9 AND 11 THEN 4
    WHEN id BETWEEN 12 AND 14 THEN 5
    WHEN id BETWEEN 15 AND 17 THEN 6
    WHEN id BETWEEN 18 AND 20 THEN 7
    WHEN id BETWEEN 21 AND 23 THEN 8
    WHEN id BETWEEN 24 AND 26 THEN 9
    WHEN id BETWEEN 27 AND 29 THEN 10
    WHEN id BETWEEN 30 AND 32 THEN 11
    WHEN id BETWEEN 33 AND 34 THEN 12
    ELSE 13 
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
	<PointMap
		title="default legend w/ value"
		data={la_locations}
		lat="lat"
		long="long"
		value="sales"
	/>
	<PointMap
		title="no legend"
		data={la_locations}
		lat="lat"
		long="long"
		value="sales"
		legend={false}
	/>
</Story>

<Story name="Loading" parameters={{ chromatic: { disableSnapshot: true } }}>
	<PointMap data={slow_la_locations} lat="lat" long="long" />
</Story>

<Story name="Legend Usage" parameters={{ chromatic: { disableSnapshot: true } }}>
	<PointMap data={grouped_locations} lat="lat" long="long" value="Category" />
	<div class="h-32"></div>
	<PointMap data={grouped_locations} valueFmt="usd" lat="lat" long="long" value="sales" />
	<div class="h-32"></div>
</Story>

<Story name="Legend Usage No Color Palette" parameters={{ chromatic: { disableSnapshot: true } }}>
	<PointMap
		legendType="categorical"
		legendPosition="bottomLeft"
		data={grouped_locations}
		lat="lat"
		long="long"
		value="Category"
	/>
	<div class="h-32"></div>
	<PointMap
		data={grouped_locations}
		lat="lat"
		long="long"
		value="sales"
		legendType="scalar"
		valueFmt="usd"
	/>
	<div class="h-32"></div>
</Story>

<Story
	name="Legend Usage w/ null values in query"
	parameters={{ chromatic: { disableSnapshot: true } }}
>
	<PointMap
		legendType="categorical"
		legendPosition="bottomLeft"
		data={null_grouped_locations}
		lat="lat"
		long="long"
		value="Category"
		colorPalette={['red', 'green', 'blue', 'purple', 'orange', 'yellow', 'brown']}
		tooltipType="hover"
		tooltip={[
			{ id: 'point_name', showColumnName: false, valueClass: 'text-lg font-semibold' },
			{ id: 'sales', fmt: 'usd', fieldClass: 'text-[grey]', valueClass: 'text-[green]' }
		]}
	/>
</Story>

<Story name="number_category point maps" parameters={{ chromatic: { disableSnapshot: true } }}>
	<PointMap
		data={number_category_grouped_locations}
		legendPosition="topLeft"
		legendType="categorical"
		lat="lat"
		long="long"
		value="sales"
		tooltipType="hover"
		tooltip={[
			{ id: 'point_name', showColumnName: false, valueClass: 'text-lg font-semibold' },
			{ id: 'sales', fmt: 'usd', fieldClass: 'text-[grey]', valueClass: 'text-[green]' }
		]}
	/>
	<div class="h-32"></div>
</Story>
<Story name="Legend Positioning Category" parameters={{ chromatic: { disableSnapshot: true } }}>
	<PointMap
		legendType="categorical"
		legendPosition="topRight"
		data={grouped_locations}
		lat="lat"
		long="long"
		value="Category"
		colorPalette={['red', 'green', 'blue', 'purple', 'orange', 'yellow', 'brown']}
		tooltipType="hover"
		tooltip={[
			{ id: 'point_name', showColumnName: false },
			{ id: 'sales', fmt: 'usd' }
		]}
	/>
	<div class="h-32"></div>
	<PointMap
		legendType="categorical"
		legendPosition="topLeft"
		data={grouped_locations}
		lat="lat"
		long="long"
		value="Category"
		colorPalette={['red', 'green', 'blue', 'purple', 'orange', 'yellow', 'brown']}
		tooltipType="hover"
		tooltip={[
			{ id: 'point_name', showColumnName: false },
			{ id: 'sales', fmt: 'usd' }
		]}
	/>
	<div class="h-32"></div>
	<PointMap
		legendType="categorical"
		legendPosition="bottomLeft"
		data={grouped_locations}
		lat="lat"
		long="long"
		value="Category"
		colorPalette={['red', 'green', 'blue', 'purple', 'orange', 'yellow', 'brown']}
		tooltipType="hover"
		tooltip={[
			{ id: 'point_name', showColumnName: false },
			{ id: 'sales', fmt: 'usd' }
		]}
	/>
	<div class="h-32"></div>
	<PointMap
		legendType="categorical"
		legendPosition="bottomRight"
		data={grouped_locations}
		lat="lat"
		long="long"
		value="Category"
		colorPalette={['red', 'green', 'blue', 'purple', 'orange', 'yellow', 'brown']}
		tooltipType="hover"
		tooltip={[
			{ id: 'point_name', showColumnName: false },
			{ id: 'sales', fmt: 'usd' }
		]}
	/>
	<div class="h-32"></div>
</Story>
<Story name="Legend Positioning Scalar" parameters={{ chromatic: { disableSnapshot: true } }}>
	<PointMap
		legendType="scalar"
		legendPosition="topRight"
		data={grouped_locations}
		lat="lat"
		long="long"
		value="sales"
		colorPalette={['red', 'green', 'blue', 'purple', 'orange', 'yellow', 'brown']}
		tooltipType="hover"
		tooltip={[
			{ id: 'point_name', showColumnName: false },
			{ id: 'sales', fmt: 'usd' }
		]}
	/>
	<div class="h-32"></div>
	<PointMap
		legendType="scalar"
		legendPosition="topLeft"
		data={grouped_locations}
		lat="lat"
		long="long"
		value="sales"
		colorPalette={['red', 'green', 'blue', 'purple', 'orange', 'yellow', 'brown']}
		tooltipType="hover"
		tooltip={[
			{ id: 'point_name', showColumnName: false },
			{ id: 'sales', fmt: 'usd' }
		]}
	/>
	<div class="h-32"></div>
	<PointMap
		legendType="scalar"
		legendPosition="bottomLeft"
		data={grouped_locations}
		lat="lat"
		long="long"
		value="sales"
		colorPalette={['red', 'green', 'blue', 'purple', 'orange', 'yellow', 'brown']}
		tooltipType="hover"
		tooltip={[
			{ id: 'point_name', showColumnName: false },
			{ id: 'sales', fmt: 'usd' }
		]}
	/>
	<div class="h-32"></div>
	<PointMap
		legendType="scalar"
		legendPosition="bottomRight"
		data={grouped_locations}
		lat="lat"
		long="long"
		value="sales"
		colorPalette={['red', 'green', 'blue', 'purple', 'orange', 'yellow', 'brown']}
		tooltipType="hover"
		tooltip={[
			{ id: 'point_name', showColumnName: false },
			{ id: 'sales', fmt: 'usd' }
		]}
	/>
	<div class="h-32"></div>
</Story>
