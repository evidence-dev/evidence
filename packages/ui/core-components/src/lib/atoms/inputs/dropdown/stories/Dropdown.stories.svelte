<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = { title: 'Atoms/Inputs/Dropdown' };
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { userEvent, within, waitFor } from '@storybook/test';

	import Dropdown from '../Dropdown.svelte';
	import InputGroup from '../../input-group/InputGroup.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import DropdownOption from '../helpers/DropdownOption.svelte';
	import DependentDropdowns from './DependentDropdowns.story.svelte';
	import DropdownCharts from './DropdownCharts.story.svelte';

	// Play Functions
	const openDropdown = async ({ canvasElement }) => {
		await new Promise((resolve) => setTimeout(resolve, 500));

		const canvas = within(canvasElement);
		let dropdown = await canvas.getByRole('combobox');
		userEvent.click(dropdown);
	};

	const searchDropdown = async ({ canvasElement }) => {
		await new Promise((resolve) => setTimeout(resolve, 500));

		const canvas = within(canvasElement);
		let dropdown = await canvas.getByRole('combobox');
		await userEvent.click(dropdown);
		await userEvent.keyboard('Alliance');
	};

	const multiSelectSelectAll = async ({ canvasElement }) => {
		await new Promise((resolve) => setTimeout(resolve, 500));

		const canvas = within(canvasElement);
		let dropdown = await waitFor(() => canvas.getByRole('combobox'));
		await userEvent.click(dropdown, { delay: 100 });
		await userEvent.keyboard('{Enter}');
	};
</script>

<Story name="Basic Usage">
	{@const data = Query.create(`SELECT id as value, tag as label from hashtags`, query)}
	<InputGroup>
		<Dropdown name="test" {data} value="value" label="label" />
		<Dropdown name="test" {data} value="value" label="label" title="Dropdown" />
		<Dropdown name="test" {data} value="value" label="label" />
		<Dropdown name="test" {data} value="value" label="label" />
		<Dropdown name="test" {data} value="value" label="label" />
		<Dropdown name="test" {data} value="value" label="label" />
		<Dropdown name="test" {data} value="value" label="label" />
		<Dropdown name="test" {data} value="value" label="label" />
	</InputGroup>
</Story>

<Story name="Loading state">
	{@const data = Query.create(`SELECT 100`, query, { noResolve: true })}
	<Dropdown name="test" {data} value="value" label="label" />
</Story>

<Story name="With explicit noDefault">
	{@const data = Query.create(`SELECT id as value, tag as label from hashtags`, query)}
	<Dropdown name="test" {data} value="value" label="label" noDefault />
</Story>

<Story name="Open" play={openDropdown}>
	{@const data = Query.create(`SELECT id as value, tag as label from hashtags`, query)}
	<Dropdown name="test" {data} value="value" label="label" />
</Story>

<Story name="Search" play={searchDropdown}>
	{@const data = Query.create(`SELECT id as value, tag as label from hashtags`, query)}
	<Dropdown name="test" {data} value="value" label="label" />
</Story>

<!-- TODO: This story is no longer useful, this needs to be a query instead -->
<Story name="Number Sorting">
	<Dropdown name="Number Sorting">
		<DropdownOption value={222} />
		<DropdownOption value={2} />
		<DropdownOption value={10} />
		<DropdownOption value={-5} />
		<DropdownOption value={99} />
		<DropdownOption value={1} />
	</Dropdown>
</Story>

<Story name="Alphabetic Sorting">
	<Dropdown name="test" defaultValue="Bottom 100">
		<DropdownOption value="Fig" />
		<DropdownOption value="Honeydew" />
		<DropdownOption value="Apple" />
		<DropdownOption value="Clementine" />
		<DropdownOption value="Dragon Fruit" />
		<DropdownOption value="Elderberry" />
		<DropdownOption value="Ichang Papeda" />
		<DropdownOption value="Grape" />
		<DropdownOption value="Banana" />
	</Dropdown>
</Story>

<Story name="Numeric-string Sorting">
	<Dropdown name="test">
		<DropdownOption value="100" />
		<DropdownOption value="101" />
		<DropdownOption value="1001" />
		<DropdownOption value="102" />
		<DropdownOption value="111" />
		<DropdownOption value="199" />
		<DropdownOption value="10000" />
		<DropdownOption value="100" />
		<DropdownOption value="101" />
	</Dropdown>
</Story>

<Story name="Numeric-string and numbers Sorting">
	<Dropdown name="test">
		<DropdownOption value="100" />
		<DropdownOption value="101" />
		<DropdownOption value="1001" />
		<DropdownOption value="102" />
		<DropdownOption value="111" />
		<DropdownOption value="199" />
		<DropdownOption value="10000" />
		<DropdownOption value="100" />
		<DropdownOption value="101" />
	</Dropdown>
</Story>

<Story name="Multiselect">
	{@const data = Query.create(`SELECT id as value, tag as label from hashtags`, query)}
	<Dropdown multiple name="test" {data} value="value" label="label" />
</Story>

<Story name="Multiselect Open" play={openDropdown}>
	{@const data = Query.create(`SELECT id as value, tag as label from hashtags`, query)}
	<Dropdown multiple name="test" {data} value="value" label="label" />
</Story>

<Story name="Multiselect Select All" play={multiSelectSelectAll}>
	{@const data = Query.create(`SELECT id as value, tag as label from hashtags`, query)}
	<Dropdown multiple name="test" {data} value="value" label="label" />
</Story>

<Story name="Select all by default">
	{@const data = Query.create(`SELECT id as value, tag as label from hashtags`, query)}
	<h1>False</h1>
	<Dropdown multiple name="test" {data} value="value" label="label" selectAllByDefault={'false'} />
	<Dropdown multiple name="test" {data} value="value" label="label" selectAllByDefault={false} />
	<h1>True</h1>
	<Dropdown multiple name="test" {data} value="value" label="label" selectAllByDefault={'true'} />
	<Dropdown multiple name="test" {data} value="value" label="label" selectAllByDefault={true} />
	<Dropdown multiple name="test" {data} value="value" label="label" selectAllByDefault />
</Story>

<Story name="With a default value">
	{@const data = Query.create(`SELECT id as value, tag as label from hashtags`, query)}
	<Dropdown defaultValue={[9]} name="test1" {data} value="value" label="label" />
</Story>

<Story name="Using Dropdowns that interact with eachother's queries">
	<DependentDropdowns />
</Story>

<Story name="Using query with null value">
	{@const data = Query.create(
		`
		select 'abc' as option
		union all
		select null as option
		union all
		select 'ghi' as option
		order by option
	`,
		query
	)}

	<Dropdown {data} name="test" value="option" />
</Story>

<Story name="Using non-query options">
	<Dropdown name="test">
		<DropdownOption value="All" />
		<DropdownOption value="Top 100" />
		<DropdownOption value="Double line breaking option" />
		<DropdownOption value="Triple line breaking option Triple line breaking option" />
		<DropdownOption value="Top 1002" />
	</Dropdown>
</Story>

<Story name="Using non-query options w/ default">
	<Dropdown name="test" defaultValue="Bottom 100">
		<DropdownOption value="All" />
		<DropdownOption value="Top 100" />
		<DropdownOption value="Bottom 100" />
	</Dropdown>
</Story>

<Story name="Using query + non-query options">
	{@const data = Query.create(`SELECT id as value, tag as label from hashtags`, query)}
	<Dropdown name="test" {data} value="value" label="label">
		<DropdownOption value="All" />
		<DropdownOption value="Top 100" />
	</Dropdown>
</Story>

<Story name="Using query + non-query options w/ Query Value Default">
	{@const data = Query.create(`SELECT id as value, tag as label from hashtags`, query)}
	<Dropdown name="test" {data} value="value" label="label" defaultValue={4}>
		<DropdownOption value="All" />
		<DropdownOption value="Top 100" />
	</Dropdown>
</Story>

<Story name="Using query + non-query options w/ Non Query Value Default">
	{@const data = Query.create(`SELECT id as value, tag as label from hashtags`, query)}
	<Dropdown name="test" {data} value="value" label="label" defaultValue="Top 100">
		<DropdownOption value="All" />
		<DropdownOption value="Top 100" />
	</Dropdown>
</Story>

<Story name="Using multiple dropdowns (same query)">
	{@const data = Query.create(`SELECT id as value, tag as label from hashtags`, query)}
	<Dropdown name="test" {data} value="value" label="label">
		<DropdownOption value="All" />
		<DropdownOption value="Top 100" />
	</Dropdown>
	<Dropdown name="test2" {data} value="value" label="label">
		<DropdownOption value="All" />
		<DropdownOption value="Top 100" />
	</Dropdown>
</Story>

<!-- Excluded from Chromatic Snapshots -->
<Story
	name="Using multiple dropdowns (same query + same name)"
	parameters={{ chromatic: { disableSnapshot: true } }}
>
	{@const data = Query.create(`SELECT id as value, tag as label from hashtags`, query)}
	<Dropdown name="test" {data} value="value" label="label">
		<DropdownOption value="All" />
		<DropdownOption value="Top 100" />
	</Dropdown>
	<Dropdown name="test" {data} value="value" label="label">
		<DropdownOption value="All" />
		<DropdownOption value="Top 100" />
	</Dropdown>
</Story>

<Story name="Dropdown with Error">
	{@const data = Query.create(
		`SELECT id as value, tag as label from hashtags this is a syntax error!`,
		query
	)}
	<Dropdown name="test" {data} value="value" label="label" />
</Story>

<Story name="Driving a Bar Chart">
	<DropdownCharts />
</Story>

<Story name="With custom ordering">
	{@const data = Query.create(`SELECT id as value, tag as label from hashtags`)}
	<Dropdown name="test" {data} value="value" label="label" order="label desc" />
</Story>

<Story name="no query multiselect">
	<Dropdown multiple name="test">
		<DropdownOption value="Top {100}" />
		<DropdownOption value="Top {101}" />
		<DropdownOption value="Top {1001}" />
		<DropdownOption value="Top 102" />
		<DropdownOption value="Top {111}" />
		<DropdownOption value="Top {199}" />
		<DropdownOption value="Top 10000" />
		<DropdownOption value="Bottom {100}" />
		<DropdownOption value="Bottom 101" />
	</Dropdown>
</Story>

<Story name="Using query + non-query options multiselect">
	{@const data = Query.create(`SELECT id as value, tag as label from hashtags`, query)}
	<Dropdown multiple name="test" {data} value="value" label="label">
		<DropdownOption value="All" />
		<DropdownOption value="Top 100" />
	</Dropdown>
</Story>

<!--
	Stories with:
		Synced dropdowns on multiple tabs
		Incorrectly synced, e.g. one is multi one is single
-->
