<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Charts/Maps/BaseMap',
		component: BaseMap,
		parameters: {
			chromatic: {
				diffThreshold: 0.2
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
	const grouped_locations_bubbles = Query.create(
		`SELECT 
		*, 
		CASE 
			WHEN sales BETWEEN 0 AND 70000 THEN 'Low'
			WHEN sales BETWEEN 70001 AND 100000 THEN 'Medium'
			WHEN sales BETWEEN 100001 AND 1000000 THEN 'High'
		END AS population
	FROM la_locations`,
		query
	);

	const grouped_locations_area = Query.create(
		`SELECT 
    *, 
    CASE 
WHEN id BETWEEN 0 AND 1500 THEN 'Residential Areas'
WHEN id BETWEEN 1501 AND 3000 THEN 'Commercial Zones'
WHEN id BETWEEN 3001 AND 4500 THEN 'Parks and Recreation'

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

		<Points data={la_locations} lat="lat" long="long" color="red" value="sales" />
	</BaseMap>
</Story>

<Story name="Multiple Base maps with legends">
	<BaseMap title="Point Map Scalar" height="300">
		<Points
			data={grouped_locations}
			lat="lat"
			long="long"
			legendType="scalar"
			value="sales"
			legendPosition="topLeft"
		/>
	</BaseMap>
	<BaseMap title="Point Map Categorical" height="300">
		<Points
			data={grouped_locations}
			lat="lat"
			long="long"
			legendType="categorical"
			value="Category"
			legendPosition="topLeft"
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
			legendPosition="topLeft"
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
			legendPosition="topLeft"
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
			legendPosition="topLeft"
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
			legendPosition="topLeft"
		/>
	</BaseMap>
	<div class="h-32"></div>
</Story>

<Story name="Single Base maps with Scalar legends">
	<BaseMap title="Scalar Legends" height="300">
		<Bubbles
			data={grouped_locations_bubbles}
			lat="lat"
			long="long"
			value="population"
			size="sales"
			opacity="0.6"
			legendType="categorical"
			colorPalette={['#C65D47', '#A97D5D', '#5BAF7A']}
		/>
		<Points
			data={grouped_locations}
			lat="lat"
			long="long"
			legendType="categorical"
			value="Category"
			legendFmt="usd"
		/>
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
	<div class="h-32"></div>
</Story>

<Story name="multi map configurations">
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
		/>
	</BaseMap>
	<BaseMap title="Scalar Legends" height="300">
		<Bubbles
			data={grouped_locations}
			lat="lat"
			long="long"
			value="Category"
			size="sales"
			opacity="0.6"
			legendType="categorical"
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
			colorPalette={['#C65D47', '#5BAF7A', '#4A8EBA', '#D35B85', '#E1C16D', '#6F5B9A', '#4E8D8D']}
		/>
	</BaseMap>
</Story>
<Story name="Multiple Points - Green on Top">
	<BaseMap title="My Map" height="300">
		<Points data={la_locations} lat="lat" long="long" color="purple" />
		<Points data={la_locations} lat="lat" long="long" color="blue" />
		<Points data={la_locations} lat="lat" long="long" color="red" />
		<Points data={la_locations} lat="lat" long="long" color="green" />
	</BaseMap>
</Story>
<Story name="bubbles on top of points">
	<BaseMap title="My Map" height="300">
		<Points data={la_locations} lat="lat" long="long" color="purple" z="1" value="sales" />
		<Bubbles
			data={la_locations}
			lat="lat"
			long="long"
			pointName="point_name"
			value="sales"
			size="sales"
			tooltipType="hover"
			opacity="0.6"
			color="blue"
			z="2"
		/>
	</BaseMap>
</Story>