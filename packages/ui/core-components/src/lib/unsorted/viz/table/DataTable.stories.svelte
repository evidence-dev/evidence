<script context="module">
	import { Story } from '@storybook/addon-svelte-csf';
	import DataTable from './DataTable.svelte';
	import Column from './Column.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import ButtonGroup from '../../../atoms/inputs/button-group/ButtonGroup.svelte';
	import ButtonGroupItem from '../../../atoms/inputs/button-group/ButtonGroupItem.svelte';
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	import { expect, userEvent, within, fn } from '@storybook/test';
	import Dropdown from '$lib/atoms/inputs/dropdown/Dropdown.svelte';
	import PointMap from '../map/PointMap.svelte';
	import AreaMap from '../map/AreaMap.svelte';
	import BaseMap from '../map/BaseMap.svelte';
	import Point from '../map/components/Point.svelte';
	import Points from '../map/components/Points.svelte';

	const mockGoto = fn();

	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Viz/Datatable',
		component: DataTable,
		parameters: {
			sveltekit_experimental: {
				navigation: {
					goto: mockGoto
				}
			}
		}
	};
</script>

<script>
	const inputStore = getInputContext();
</script>

<Story name="Simple Case">
	{@const data = Query.create(`SELECT * from flights LIMIT 1000`, query)}
	<DataTable {data} />
</Story>

<Story name="With Sort">
	{@const data = Query.create(`SELECT * from flights LIMIT 1000`, query)}
	<DataTable {data} sort="fare desc" />
</Story>

<Story name="Bar Viz">
	{@const data = Query.create(
		`
	SELECT 'a' as category, 10000 as value, 1598 as orders
	union all
	SELECT 'a' as category, 8000 as value, 5613 as orders
	union all
	SELECT 'a' as category, -7000 as value, 4151 as orders
	union all
	SELECT 'b' as category, 3000 as value, 4569 as orders
	union all
	SELECT 'b' as category, 2400 as value, 1523 as orders
	union all
	SELECT 'b' as category, 1200 as value, 1838 as orders
	`,
		query
	)}
	<DataTable {data}>
		<Column id="category" />
		<Column id="value" contentType="bar" fmt="usd" hideLabels="false" />
		<Column id="orders" contentType="bar" hideLabels="false" align="left" />
	</DataTable>
</Story>

<Story name="Sparkline">
	{@const data = Query.create(
		`
	select category, array_agg({'date': date, 'value': value}) as sparkline from (
	SELECT 'Grocery' as category, '2024-01-01'::date as date, 100 as value, 284 as orders
	union all
	SELECT 'Grocery' as category, '2024-01-02'::date as date, 80 as value, 648 as orders
	union all
	SELECT 'Grocery' as category, '2024-01-03'::date as date, 70 as value, 442 as orders
	union all
	SELECT 'Retail' as category, '2024-01-01'::date as date, 30 as value, 483 as orders
	union all
	SELECT 'Retail' as category, '2024-01-02'::date as date, 24 as value, 112 as orders
	union all
	SELECT 'Retail' as category, '2024-01-03'::date as date, 12 as value, 648 as orders
	) group by all
	`,
		query
	)}
	<DataTable {data}>
		<Column id="category" />
		<Column
			id="sparkline"
			title="Sparkline"
			contentType="sparkline"
			sparkX="date"
			sparkY="value"
			sparkColor="green"
		/>
		<Column
			id="sparkline"
			title="Sparkbar"
			contentType="sparkbar"
			sparkX="date"
			sparkY="value"
			sparkColor="navy"
		/>
		<Column id="sparkline" title="Sparkarea" contentType="sparkarea" sparkX="date" sparkY="value" />
	</DataTable>
</Story>

<Story name="With Search">
	{@const data = Query.create(`SELECT * from flights LIMIT 1000`, query)}
	<DataTable {data} title="Flights" search>
		<Column id="id" title="ID" />
		<Column id="airline" title="Airline" />
		<Column id="departure_airport" title="Departure Airport" />
		<Column id="arrival_airport" title="Arrival Airport" />
	</DataTable>
</Story>

<Story name="With Search (LIMIT 100000)">
	{@const data = Query.create(`SELECT * from flights LIMIT 100000`, query)}
	<DataTable {data} title="Flights" search>
		<Column id="id" title="ID" />
		<Column id="airline" title="Airline" />
		<Column id="departure_airport" title="Departure Airport" />
		<Column id="arrival_airport" title="Arrival Airport" />
	</DataTable>
</Story>

<Story name="With Groups">
	{@const data = Query.create(
		`SELECT * from flights where regulator in ('Afghanistan', 'Belgium', 'Canada', 'Denmark') limit 50`,
		query
	)}
	<DataTable {data} title="Flights" search groupBy="regulator" groupsOpen="false">
		<Column id="id" title="ID" />
		<Column id="airline" title="Airline" />
		<Column id="departure_airport" title="Departure Airport" />
		<Column id="arrival_airport" title="Arrival Airport" />
	</DataTable>
</Story>

<Story name="With Group Sorting">
	{@const data = Query.create(
		`SELECT 
			'd' as category, 'xd' as item, 2000 as sales
			union all
			select 'd','yd',400
			union all
			select 'd','zd',4000
			union all
			select 'b','xb',5000			
			union all
			select 'b','yb',1			
			union all
			select 'b','zb',3
		`,
		query
	)}
	<DataTable {data} groupBy="category" sort="sales desc" subtotals="true">
		<Column id="category" />
		<Column id="item" />
		<Column id="sales" fmt="usd" />
	</DataTable>
</Story>

<Story name="With Search (Long Columns)">
	{@const data = Query.create(`SELECT * from blog_posts`, query)}
	<DataTable {data} title="Blog Posts" search />
</Story>

<Story
	name="Reactive columns"
	play={async ({ canvasElement }) => {
		const screen = within(canvasElement);

		expect(await screen.findByRole('columnheader', { name: 'Column A' })).toBeInTheDocument();
		expect(await screen.findByRole('cell', { name: 'Value A' })).toBeInTheDocument();

		await userEvent.click(await screen.findByRole('button', { name: 'Column B' }));
		expect(await screen.findByRole('columnheader', { name: 'Column B' })).toBeInTheDocument();
		expect(await screen.findByRole('cell', { name: 'Value B' })).toBeInTheDocument();

		await userEvent.click(await screen.findByRole('button', { name: 'Column A' }));
		expect(await screen.findByRole('columnheader', { name: 'Column A' })).toBeInTheDocument();
		expect(await screen.findByRole('cell', { name: 'Value A' })).toBeInTheDocument();
	}}
>
	{@const data = Query.create(
		`SELECT '7 days' as cohort, 'stuff' as metadata, 'Value A' as "Column A", 'Value B' as "Column B"`,
		query
	)}

	<ButtonGroup name="dimension">
		<ButtonGroupItem value="Column A" valueLabel="Column A" default />
		<ButtonGroupItem value="Column B" valueLabel="Column B" />
	</ButtonGroup>

	<DataTable {data} rowNumbers>
		<Column id="cohort" title="Week" />
		<Column id={$inputStore.dimension} />
		<Column id="metadata" title="Metadata" />
	</DataTable>
</Story>

<Story name="Full screen no scroll to top">
	{@const data = Query.create(`SELECT * from flights LIMIT 100`, query)}
	<h1>Top of Page</h1>
	<div
		style="height: 70vh; border: 1px solid black; display: flex; flex-direction: column; justify-content: center; align-items: center;"
	>
		<h2>When clicked on fullscreen should not scroll to top</h2>
	</div>
	<DataTable {data} title="Blog Posts" search />
	<div
		style="height: 30vh; border: 1px solid black; display: flex; flex-direction: column; justify-content: center; align-items: center;"
	>
		<h2>Click Full Screen</h2>
	</div>
	<DataTable {data} title="Blog Posts" search />
	<div
		style="height: 30vh; border: 1px solid black; display: flex; flex-direction: column; justify-content: center; align-items: center;"
	>
		<h2>Bottom of page</h2>
	</div>
</Story>

<Story
	name="Row links"
	play={async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// This matches the devtools too, so we have to use index 1
		const internals = await canvas.findAllByText('Internal', { exact: true });
		const internal = internals[1];
		await userEvent.click(internal);
		expect(mockGoto).toHaveBeenCalledTimes(1);
		expect(mockGoto).toHaveBeenCalledWith('?bingbong=true');

		// TODO testing the external link is tricky because it navigates away from the storybook
	}}
>
	{@const data = Query.create(
		`
		SELECT 'Internal' as type, '?bingbong=true' as link UNION ALL
		SELECT 'External' as type, 'https://example.com' as link UNION ALL
		SELECT 'No link' as type, null as link
		`,
		query
	)}
	<DataTable {data} link="link" />
</Story>

<Story
	name="Row links with showLinkCol"
	play={async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// This matches the devtools too, so we have to use index 1
		const internals = await canvas.findAllByText('Internal', { exact: true });
		const internal = internals[1];
		await userEvent.click(internal);
		expect(mockGoto).toHaveBeenCalledTimes(1);
		expect(mockGoto).toHaveBeenCalledWith('?bingbong=true');

		// TODO testing the external link is tricky because it navigates away from the storybook
	}}
>
	{@const data = Query.create(
		`
		SELECT 'Internal' as type, '?bingbong=true' as link UNION ALL
		SELECT 'External' as type, 'https://example.com' as link UNION ALL
		SELECT 'No link' as type, null as link
		`,
		query
	)}
	<DataTable {data} link="link" showLinkCol />
</Story>

<Story
	name="Conditional Columns"
	play={async ({ canvasElement }) => {
		const screen = within(canvasElement);

		expect(await screen.findByRole('columnheader', { name: 'Airline' })).toBeInTheDocument();
		expect(await screen.findByRole('cell', { name: 'Virgin Australia' })).toBeInTheDocument();

		await userEvent.click(await screen.findByRole('button', { name: 'Departure Airport' }));
		expect(
			await screen.findByRole('columnheader', { name: 'Departure Airport' })
		).toBeInTheDocument();
		expect(
			await screen.findByRole('cell', { name: 'Soekarno-Hatta International Airport' })
		).toBeInTheDocument();
		expect(screen.queryByRole('columnheader', { name: 'Airline' })).toBeNull();
		expect(screen.queryByRole('cell', { name: 'Virgin Australia' })).toBeNull();

		await userEvent.click(await screen.findByRole('button', { name: 'Arrival Airport' }));
		expect(
			await screen.findByRole('columnheader', { name: 'Arrival Airport' })
		).toBeInTheDocument();
		expect(
			await screen.findByRole('cell', { name: 'Bole International Airport' })
		).toBeInTheDocument();
		expect(screen.queryByRole('columnheader', { name: 'Airline' })).toBeNull();
		expect(screen.queryByRole('cell', { name: 'Virgin Australia' })).toBeNull();
		expect(screen.queryByRole('columnheader', { name: 'Departure Airport' })).toBeNull();
		expect(screen.queryByRole('cell', { name: 'Soekarno-Hatta International Airport' })).toBeNull();

		await userEvent.click(await screen.findByRole('button', { name: 'Airline' }));
		expect(await screen.findByRole('columnheader', { name: 'Airline' })).toBeInTheDocument();
		expect(await screen.findByRole('cell', { name: 'Virgin Australia' })).toBeInTheDocument();
	}}
>
	{@const data = Query.create(
		`SELECT * from flights where regulator in ('Afghanistan', 'Belgium', 'Canada', 'Denmark') order by id limit 50`,
		query
	)}

	<ButtonGroup name="display_column">
		<ButtonGroupItem value="airline" valueLabel="Airline" default />
		<ButtonGroupItem value="departure" valueLabel="Departure Airport" />
		<ButtonGroupItem value="arrival" valueLabel="Arrival Airport" />
	</ButtonGroup>

	<DataTable {data} title="Flights">
		<Column id="id" title="ID" />
		{#if $inputStore.display_column === 'airline'}
			<Column id="airline" title="Airline" />
		{:else if $inputStore.display_column === 'departure'}
			<Column id="departure_airport" title="Departure Airport" />
		{:else}
			<Column id="arrival_airport" title="Arrival Airport" />
		{/if}
	</DataTable>
</Story>

<Story name="error chart test">
	{@const data2 = Query.create(`SELECT id as value, tag as label from hashtags`, query)}
	<Dropdown name="test" {data2} value="value" label="label" />
	{@const data = Query.create(`SELECT * from flight LIMIT 1000`, query)}
	<DataTable {data} />
	<Dropdown name="test" {data2} value="value" label="label" />
	{@const la_locations = Query.create(`select * from la_locations order by 1`, query)}
	<PointMap data={la_locations} lat="lat" long="longg" value="sales" legend={false} />
	<Dropdown name="test" {data2} value="value" label="label" />
	<BaseMap>
		<Points
			data={la_locations}
			lat="lat"
			long="longg"
			value="sales"
			legend={false}
			tooltipType="hover"
		/>
	</BaseMap>
	<Dropdown name="test" {data2} value="value" label="label" />
	{@const la_zip_sales = Query.create(
		`select * from la_zip_sales where zip_code <> 90704 order by 1`,
		query
	)}
	<AreaMap data={la_zip_sales} geoId="ZCTA5CE10" value="sales" areaCol="zip_codesadasdasds" />
</Story>
