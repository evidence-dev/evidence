<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = { title: 'Charts/Map' };
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import BaseMap from './BaseMap.svelte';
	import PointMap from './PointMap.svelte';
	import AreaMap from './AreaMap.svelte';
	import BubbleMap from './BubbleMap.svelte';
	import Points from './components/Points.svelte';
	import Bubbles from './components/Bubbles.svelte';
	import Areas from './components/Areas.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

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

<!-- Exlcuded from chromatic, map layers don't reliably load in the same order -->
<Story name="Basic Usage" parameters={{ chromatic: { disableSnapshot: true } }}>
	<BaseMap title="My Map" height="300">
		<Points
			data={la_locations}
			lat="lat"
			long="long"
			value="sales"
			tooltip={[{ title: 'Sales, LTM' }]}
			colorPalette={['white', 'green']}
			size="20"
			opacity="0.7"
			borderWidth="0"
		/>
		<Bubbles
			name="test"
			{data}
			lat="lat"
			long="long"
			pointName="point_name"
			value="sales"
			size="sales"
			tooltipType="hover"
			opacity="0.6"
			colorPalette={['red', 'navy', 'purple']}
		/>
		<Points
			name="test"
			{data}
			lat="lat"
			long="long"
			color="orange"
			pointSize="8"
			pointScaleCol="sales"
			value="sales"
			valueFmt="eur"
			tooltip={[{ id: 'sales', title: 'My Sales' }]}
			colorPalette={['lightblue', 'navy', 'purple']}
			tooltipType="click"
		/>
		<Areas
			data={la_zip_sales}
			geoJsonUrl="https://evd-geojson.b-cdn.net/ca_california_zip_codes_geo_1.min.json"
			areaCol="zip_code"
			name="area"
			value="sales"
			geoId="ZCTA5CE10"
			valueFmt="usd"
			tooltipType="hover"
			opacity="1"
		/>
		<Points data={la_locations} lat="lat" long="long" color="orange" />
	</BaseMap>

	<AreaMap
		data={la_zip_sales}
		geoJsonUrl="https://evd-geojson.b-cdn.net/ca_california_zip_codes_geo_1.min.json"
		value="sales"
		geoId="ZCTA5CE10"
		areaCol="zip_code"
	/>
	<PointMap data={la_locations} lat="lat" long="long" />
	<BubbleMap data={la_locations} lat="lat" long="long" size="sales" />
</Story>

<Story name="Points Map">
	<PointMap data={la_locations} lat="lat" long="long" />
</Story>
