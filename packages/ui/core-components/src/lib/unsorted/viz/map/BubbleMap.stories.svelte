<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Charts/Maps/BubbleMap',
		component: BubbleMap
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	import BubbleMap from './BubbleMap.svelte';

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
</script>

<Story name="Basic Usage" parameters={{ chromatic: { disableSnapshot: true } }}>
	<BubbleMap data={la_locations} lat="lat" long="long" size="sales" value="sales" />
</Story>

<Story name="Loading" parameters={{ chromatic: { disableSnapshot: true } }}>
	<BubbleMap data={slow_la_locations} lat="lat" long="long" size="sales" />
</Story>

<Story name="Legend Usage" parameters={{ chromatic: { disableSnapshot: true } }}>
	<BubbleMap
		legendType="categorical"
		legendPosition="bottomLeft"
		data={grouped_locations}
		lat="lat"
		long="long"
		value="Category"
		size="sales"
		colorPalette={['red', 'green', 'blue', 'purple', 'orange', 'yellow', 'brown']}
		tooltipType="hover"
		tooltip={[
			{ id: 'point_name', showColumnName: false, valueClass: 'text-lg font-semibold' },
			{ id: 'sales', fmt: 'usd', fieldClass: 'text-[grey]', valueClass: 'text-[green]' }
		]}
	/>
	<div class="h-32"></div>
	<BubbleMap
		data={grouped_locations}
		legendType="scalar"
		lat="lat"
		long="long"
		value="sales"
		size="sales"
		colorPalette={['red', 'blue', 'green']}
		tooltipType="hover"
		tooltip={[
			{ id: 'point_name', showColumnName: false, valueClass: 'text-lg font-semibold' },
			{ id: 'sales', fmt: 'usd', fieldClass: 'text-[grey]', valueClass: 'text-[green]' }
		]}
	/>
	<div class="h-32"></div>
</Story>
<Story name="Legend Usage 4 corners" parameters={{ chromatic: { disableSnapshot: true } }}>
	<BubbleMap
		legendType="categorical"
		legendPosition="bottomLeft"
		data={grouped_locations}
		lat="lat"
		long="long"
		value="Category"
		size="sales"
	/>
	<div class="h-32"></div>
	<BubbleMap
		data={grouped_locations}
		legendType="scalar"
		lat="lat"
		long="long"
		value="sales"
		size="sales"
		legendPosition="topLeft"
	/>
	<div class="h-32"></div>
	<BubbleMap
		legendType="categorical"
		legendPosition="bottomRight"
		data={grouped_locations}
		lat="lat"
		long="long"
		value="Category"
		size="sales"
	/>
	<div class="h-32"></div>
	<BubbleMap
		data={grouped_locations}
		legendType="scalar"
		lat="lat"
		long="long"
		value="sales"
		size="sales"
		legendPosition="topRight"
	/>
	<div class="h-32"></div>

</Story>


<Story name="Error States" parameters={{ chromatic: { disableSnapshot: true } }}>
	<h1>Missing Data</h1>
	<BubbleMap  lat="lat" long="long" size="sales" value="sales" />

	<h1>Missing lat</h1>
	<BubbleMap data={la_locations} long="long" size="sales" value="sales" />


	<h1>Missing long</h1>
	<BubbleMap data={la_locations} lat="lat" size="sales" value="sales" />

	<h1>Missing size</h1>
	<BubbleMap data={la_locations} lat="lat" long="long" value="sales" />

	<h1>value not found in data</h1>
	<BubbleMap data={la_locations} lat="lat" long="long" size="sales" value="sadles" />

	<h1>size not found in data</h1>
	<BubbleMap data={la_locations} lat="lat" long="long" size="sadles" value="sales" />


	<h1>lat not found in data</h1>
	<BubbleMap data={la_locations} lat="ladt" long="long" size="sales" value="sales" />


	<h1>long not found in data</h1>
	<BubbleMap data={la_locations} lat="lat" long="lodng" size="sales" value="sales" />

</Story>
