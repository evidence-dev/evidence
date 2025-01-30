<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Atoms/inputs/DateInput',
		argTypes: {},
		args: {
			title: 'Date Input',
			name: 'DateInput',
			omitGroup: []
		}
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';
	import DateInput from './DateInput.svelte';
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	import { onMount } from 'svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	const inputStore = getInputContext();

	// Mock "today"
	import MockDate from 'mockdate';

	MockDate.set('2024-12-30');
	onMount(() => () => MockDate.reset());

	const data = Query.create(`SELECT * FROM Flights`, query);

	const queryErrorData = Query.create(`SELECT * FROM Flights`, query);
</script>

<Template let:args>
	<DateInput {...args} />
</Template>

<Story name="Basic Usage" let:args>
	<h1>
		Input Store:
		<h2>value: {$inputStore.dateInput.value}</h2>
		<h2>start: {$inputStore.dateInput.start}</h2>
		<h2>end: {$inputStore.dateInput.end}</h2>
	</h1>
	<DateInput {...args} name="dateInput" />
</Story>
<Story name="dateInput_range" let:args>
	<h1>
		Input Store:
		<h2>value: {$inputStore.dateInput_range.value}</h2>
		<h2>start: {$inputStore.dateInput_range.start}</h2>
		<h2>end: {$inputStore.dateInput_range.end}</h2>
	</h1>
	<DateInput {...args} name="dateInput_range" range />
</Story>
<Story name="Name Error" let:args>
	<h1>Good Data</h1>
	<DateInput {...args} name="dateInput" {data} dates="departure_date" />
	<h1>Date Input</h1>
	<DateInput {...args} name={undefined} />
	<h1>Date Input Range</h1>
	<DateInput {...args} range name={undefined} />
	<h1>Data is a string</h1>
	<DateInput name="dataString" data="dateQuery" />
	<h1>Data has a query error</h1>
	<DateInput name="QueryError" data={queryErrorData} />
</Story>
