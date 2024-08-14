<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Charts/Maps/AreaMap',
		component: AreaMap
	};
</script>

<script>
	import { getContext } from 'svelte';
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { Dropdown, DropdownOption } from '../../../atoms/inputs/dropdown/index.js';

	import AreaMap from './AreaMap.svelte';

	const inputStore = getContext(INPUTS_CONTEXT_KEY);

	/** @type {typeof query} */
	const slowQuery = async (...args) => {
		await new Promise((resolve) => setTimeout(resolve, 5_000));
		return query(...args);
	};

	const la_zip_sales = Query.create(
		`select * from la_zip_sales where zip_code <> 90704 order by 1`,
		query
	);

	const slow_la_zip_sales = Query.create(
		`select * from la_zip_sales where zip_code <> 90704 order by 1 limit 100`,
		slowQuery
	);

	const state_sales = Query.create(`select * from state_sales`, query);
</script>

<Story name="Basic Usage" parameters={{ chromatic: { disableSnapshot: true } }}>
	<AreaMap data={la_zip_sales} geoId="ZCTA5CE10" value="sales" areaCol="zip_code" />
</Story>

<Story name="Loading" parameters={{ chromatic: { disableSnapshot: true } }}>
	<AreaMap data={slow_la_zip_sales} geoId="ZCTA5CE10" value="sales" areaCol="zip_code" />
</Story>

<Story name="Reactive geoJsonUrl">
	<Dropdown name="dropdown">
		<DropdownOption value="la" valueLabel="Sales by LA ZIP Code" default />
		<DropdownOption value="states" valueLabel="Orders by State" />
	</Dropdown>

	<AreaMap
		data={$inputStore.dropdown.value === 'la' ? la_zip_sales : state_sales}
		geoJsonUrl={$inputStore.dropdown.value === 'la'
			? 'https://evd-geojson.b-cdn.net/ca_california_zip_codes_geo_1.min.json'
			: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_1_states_provinces_shp.geojson'}
		geoId={$inputStore.dropdown.value === 'la' ? 'ZCTA5CE10' : 'name'}
		areaCol={$inputStore.dropdown.value === 'la' ? 'zip_code' : 'state'}
		value={$inputStore.dropdown.value === 'la' ? 'sales' : 'orders'}
	/>
</Story>
