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
	<DataTable {data} title="Flights" search groupBy="regulator">
		<Column id="id" title="ID" />
		<Column id="airline" title="Airline" />
		<Column id="departure_airport" title="Departure Airport" />
		<Column id="arrival_airport" title="Arrival Airport" />
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
