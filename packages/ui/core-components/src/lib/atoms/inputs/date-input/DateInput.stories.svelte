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
	const inputStore = getInputContext();

	// Mock "today"
	import MockDate from 'mockdate';
	MockDate.set('2024-12-30');
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
