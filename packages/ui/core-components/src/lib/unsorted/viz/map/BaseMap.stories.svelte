<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Charts/Maps/BaseMap',
		component: BaseMap,
		parameters: {
			chromatic: {
				diffThreshold: 0.2,
				// Disabled until https://github.com/evidence-dev/evidence/issues/2560 is resolved
				disableSnapshot: true
			}
		}
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	import BaseMap from './BaseMap.svelte';
	import Points from './components/Points.svelte';
	import Bubbles from './components/Bubbles.svelte';
	import Areas from './components/Areas.svelte';

	const la_zip_sales = Query.create(
		`select * from la_zip_sales where zip_code <> 90704 order by 1`,
		query
	);

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

	const grouped_locations_area = Query.create(
		`SELECT 
    *, 
    CASE 
        WHEN id BETWEEN 0 AND 500 THEN 'Hotels'
        WHEN id BETWEEN 501 AND 1000 THEN 'Restaurants'
        WHEN id BETWEEN 1001 AND 1500 THEN 'Golf Courses'
        WHEN id BETWEEN 1501 AND 2000 THEN 'Shops'
        WHEN id BETWEEN 2001 AND 2500 THEN 'Bars'
        WHEN id BETWEEN 2501 AND 3000 THEN 'Entertainment'
        WHEN id BETWEEN 3001 AND 4000 THEN 'Banks'
    END AS Category
FROM la_zip_sales
WHERE zip_code <> 90704
ORDER BY 1;
`,
		query
	);
</script>

<Story name="Basic Usage">
	<BaseMap title="My Map" height="300">
		<Areas
			data={la_zip_sales}
			geoJsonUrl="/geo-json/ca_california_zip_codes_geo_1.min.json"
			areaCol="zip_code"
			name="area"
			value="sales"
			geoId="ZCTA5CE10"
			valueFmt="usd"
			tooltipType="hover"
			opacity="1"
		/>

		<Bubbles
			data={la_locations}
			lat="lat"
			long="long"
			pointName="point_name"
			value="sales"
			size="sales"
			tooltipType="hover"
			opacity="0.6"
		/>

		<Points data={la_locations} lat="lat" long="long" color="red" />
	</BaseMap>
</Story>

<Story name="Multiple Base maps with legends">
	<BaseMap title="Point Map Scalar" height="300">
		<Points data={grouped_locations} lat="lat" long="long" legendType="scalar" value="sales" />
	</BaseMap>
	<BaseMap title="Point Map Categorical" height="300">
		<Points
			data={grouped_locations}
			lat="lat"
			long="long"
			legendType="categorical"
			value="Category"
		/>
	</BaseMap>
	<BaseMap title="Bubble Map Scalar" height="300">
		<Bubbles
			data={grouped_locations}
			lat="lat"
			long="long"
			value="sales"
			size="sales"
			opacity="0.6"
			legendType="scalar"
		/>
	</BaseMap>
	<BaseMap title="Bubble Map Categorical" height="300">
		<Bubbles
			data={grouped_locations}
			lat="lat"
			long="long"
			value="Category"
			size="sales"
			opacity="0.6"
			legendType="categorical"
		/>
	</BaseMap>
	<BaseMap title="Area Map Scalar" height="300">
		<Areas
			data={grouped_locations_area}
			geoJsonUrl="/geo-json/ca_california_zip_codes_geo_1.min.json"
			areaCol="zip_code"
			name="area"
			value="sales"
			geoId="ZCTA5CE10"
			valueFmt="usd"
			tooltipType="hover"
			opacity="1"
			legendType="scalar"
		/>
	</BaseMap>
	<BaseMap title="Area Map Categorical" height="300">
		<Areas
			data={grouped_locations_area}
			geoJsonUrl="/geo-json/ca_california_zip_codes_geo_1.min.json"
			areaCol="zip_code"
			name="area"
			value="Category"
			geoId="ZCTA5CE10"
			valueFmt="usd"
			tooltipType="hover"
			opacity="1"
			legendType="categorical"
		/>
	</BaseMap>
	<div class="h-32"></div>
</Story>
<Story name="Single Base maps with Scalar legends">
	<BaseMap title="Scalar Legends" height="300">
		<Points
			data={grouped_locations}
			lat="lat"
			long="long"
			legendType="scalar"
			value="sales"
			legendFmt="usd"
		/>
		<Bubbles
			data={grouped_locations}
			lat="lat"
			long="long"
			value="Category"
			size="sales"
			opacity="0.6"
			legendType="categorical"
			legendPosition="topLeft"
		/>
		<Areas
			data={grouped_locations_area}
			geoJsonUrl="/geo-json/ca_california_zip_codes_geo_1.min.json"
			areaCol="zip_code"
			name="area"
			value="Category"
			geoId="ZCTA5CE10"
			valueFmt="usd"
			tooltipType="hover"
			opacity="1"
			legendType="categorical"
			legendPosition="topRight"
			colorPalette={['#C65D47', '#5BAF7A', '#4A8EBA', '#D35B85', '#E1C16D', '#6F5B9A', '#4E8D8D']}
		/>
	</BaseMap>
</Story>
