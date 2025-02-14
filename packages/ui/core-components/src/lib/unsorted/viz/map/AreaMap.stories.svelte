<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Charts/Maps/AreaMap',
		component: AreaMap
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	import { Dropdown, DropdownOption } from '../../../atoms/inputs/dropdown/index.js';
	import AreaMap from './AreaMap.svelte';
	import { screen, userEvent, within } from '@storybook/test';

	const inputStore = getInputContext();

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

	const grouped_locations = Query.create(
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

<Story name="Basic Usage" parameters={{ chromatic: { disableSnapshot: true } }}>
	<AreaMap data={la_zip_sales} geoId="ZCTA5CE10" value="sales" areaCol="zip_code" />
</Story>

<Story name="Loading" parameters={{ chromatic: { disableSnapshot: true } }}>
	<AreaMap data={slow_la_zip_sales} geoId="ZCTA5CE10" value="sales" areaCol="zip_code" />
</Story>

<Story
	name="Dynamic geoJsonUrl"
	play={async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const dropdown = await canvas.findByRole('combobox');
		await userEvent.click(dropdown);
		const option = await screen.findByText('Pennsylvania');
		await userEvent.click(option);
	}}
>
	{@const sales_by_zip = Query.create(
		`
			SELECT '11368' as zip_code, 1000 as sales UNION ALL
			SELECT '10025', 2000 UNION ALL
			SELECT '15001', 3000 UNION ALL
			SELECT '15003', 4000 UNION ALL
			SELECT '08327', 5000 UNION ALL
			SELECT '08055', 6000
		`,
		query
	)}

	<Dropdown name="state" title="State" defaultValue="new_york">
		<DropdownOption value="new_york" valueLabel="New York" />
		<DropdownOption value="pennsylvania" valueLabel="Pennsylvania" />
		<DropdownOption value="new_jersey" valueLabel="New Jersey" />
	</Dropdown>

	<AreaMap
		data={sales_by_zip}
		geoJsonUrl="https://cybersyn-streamlit.s3.amazonaws.com/{$inputStore.state
			.value}_zipcode_boundaries.geojson"
		geoId="zip_code"
		areaCol="zip_code"
		value="sales"
	/>
</Story>

<Story name="Legend Usage" parameters={{ chromatic: { disableSnapshot: true } }}>
	<AreaMap
		legendType="categorical"
		legendPosition="bottomLeft"
		data={grouped_locations}
		lat="lat"
		long="long"
		value="Category"
		geoId="ZCTA5CE10"
		areaCol="zip_code"
		colorPalette={['red', 'green', 'blue', 'purple', 'orange', 'yellow', 'brown']}
	/>
	<div class="h-32"></div>
	<AreaMap
		legendType="scalar"
		legendPosition="bottomLeft"
		data={grouped_locations}
		lat="lat"
		long="long"
		value="sales"
		geoId="ZCTA5CE10"
		areaCol="zip_code"
		colorPalette={['red', 'yellow', 'green']}
	/>
	<div class="h-32"></div>
</Story>
<Story name="Legend Usage no color palette" parameters={{ chromatic: { disableSnapshot: true } }}>
	<AreaMap
		legendType="categorical"
		legendPosition="bottomLeft"
		data={grouped_locations}
		lat="lat"
		long="long"
		value="Category"
		geoId="ZCTA5CE10"
		areaCol="zip_code"
	/>
	<div class="h-32"></div>
	<AreaMap
		legendType="scalar"
		legendPosition="bottomLeft"
		data={grouped_locations}
		lat="lat"
		long="long"
		value="sales"
		geoId="ZCTA5CE10"
		areaCol="zip_code"
	/>
	<div class="h-32"></div>
</Story>

<Story name="Error States" parameters={{ chromatic: { disableSnapshot: true } }}>
	<h1>Missing Data</h1>
	<AreaMap geoId="ZCTA5CE10" value="sales" areaCol="zip_code" />

	<h1>Missing geoId</h1>
	<AreaMap data={slow_la_zip_sales} value="sales" areaCol="zip_code" />

	<h1>Missing areaCol</h1>
	<AreaMap data={slow_la_zip_sales} geoId="ZCTA5CE10" value="sales" />

	<h1>value not found in data</h1>
	<AreaMap data={slow_la_zip_sales} geoId="ZCTA5CE10" value="sadles" areaCol="zip_code" />

	<h1>areaCol not found in data</h1>
	<AreaMap data={slow_la_zip_sales} geoId="ZCTA5CE10" value="sales" areaCol="zipd_code" />
</Story>
<Story name="No Legend" parameters={{ chromatic: { disableSnapshot: true } }}>
	<AreaMap
		legendType="categorical"
		legendPosition="bottomLeft"
		data={grouped_locations}
		lat="lat"
		long="long"
		value="Category"
		geoId="ZCTA5CE10"
		areaCol="zip_code"
		legend="false"
	/>
</Story>

<Story name="Custom height" parameters={{ chromatic: { disableSnapshot: true } }}>
	<AreaMap
		data={slow_la_zip_sales}
		geoId="ZCTA5CE10"
		value="sales"
		areaCol="zip_code"
		height=500
	/>
</Story>
