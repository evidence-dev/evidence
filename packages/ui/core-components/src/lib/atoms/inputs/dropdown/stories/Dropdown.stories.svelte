<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = { title: 'Atoms/Inputs/Dropdown', decorators: [() => WithScopedInputStore] };
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import Dropdown from '../Dropdown.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import WithScopedInputStore from '../../../../storybook-helpers/WithScopedInputStore.svelte';
	import DropdownOption from '../helpers/DropdownOption.svelte';
	import DependentDropdowns from './DependentDropdowns.story.svelte';

	import DropdownCharts from './DropdownCharts.story.svelte';
</script>

<Story name="Basic Usage">
	{@const data = Query.create(`SELECT id as value, tag as label from hashtags`, query)}
	<Dropdown name="test" {data} value="value" label="label" />
</Story>
<Story name="Number filtering">
	<Dropdown name="Number filtering">
		<DropdownOption value={222} />
		<DropdownOption value={2} />
		<DropdownOption value={10} />
		<DropdownOption value={-5} />
		<DropdownOption value={99} />
		<DropdownOption value={1} />
	</Dropdown>
</Story>

<Story name="Alphabetic filtering">
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

<Story name="String Number filtering">
	<Dropdown name="test" defaultValue="Bottom 100">
		<DropdownOption value="Top {100}" />
		<DropdownOption value="Top {101}" />
		<DropdownOption value="Top {1001}" />
		<DropdownOption value="Top {102}" />
		<DropdownOption value="Top {111}" />
		<DropdownOption value="Top {199}" />
		<DropdownOption value="Top {10000}" />
		<DropdownOption value="Bottom {100}" />
		<DropdownOption value="Bottom {101}" />
	</Dropdown>
</Story>

<Story name="Strings and Mixed String-Numbers filtering">
	<Dropdown name="test" defaultValue="Bottom 100">
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
<Story name="Multiselect">
	{@const data = Query.create(`SELECT id as value, tag as label from hashtags`, query)}
	<Dropdown multiple name="test" {data} value="value" label="label" />
</Story>
<Story name="Select all by default">
	{@const data = Query.create(`SELECT id as value, tag as label from hashtags`, query)}
	<Dropdown multiple name="test" {data} value="value" label="label" selectAllByDefault />
</Story>
<Story name="With a default value">
	{@const data = Query.create(`SELECT id as value, tag as label from hashtags`, query)}
	<Dropdown defaultValue={0} name="test1" {data} value="value" label="label" />
</Story>
<Story name="With a non-static default value">
	{@const data = Query.create(
		`
	-- Select each day of the last 7 days using duckdb

	SELECT 	strftime(generate_series, '%Y-%m-%d') as value 
	from generate_series(
		DATE_TRUNC('day', current_date - interval 7 days),
		DATE_TRUNC('day', current_date),
		interval 1 day
	)
	order by 1 desc
	`,
		query
	)}

	<Dropdown
		defaultValue={new Date(Date.now() - 86400000).toISOString().split('T')[0]}
		name="your-dropdown"
		{data}
		value="value"
	/>
</Story>
<Story name="Using Dropdowns that interact with eachother's queries">
	<DependentDropdowns />
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

<Story name="Using multiple dropdowns (same query + same name)">
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
