<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Charts/Maps/BaseMap',
		component: BaseMap
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

	const data = Query.create(
		`SELECT * from locations order by point_name asc limit 20 order by 1`,
		query
	);

	const la_zip_sales = Query.create(
		`select * from la_zip_sales where zip_code <> 90704 order by 1`,
		query
	);

	const la_locations = Query.create(`select * from la_locations order by 1`, query);
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
