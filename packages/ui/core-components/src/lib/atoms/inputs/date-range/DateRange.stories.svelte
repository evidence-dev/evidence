<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Atoms/inputs/DateRange',
		argTypes: {},
		args: {
			title: 'Date Range, Including Presets',
			name: 'dateRange',
			omitGroup: []
		}
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';
	import DateRange from './DateRange.svelte';
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	import { onMount } from 'svelte';
	const inputStore = getInputContext();

	// Mock "today"
	import MockDate from 'mockdate';

	MockDate.set('2024-06-19');
	onMount(() => () => MockDate.reset());
</script>

<Template let:args>
	<DateRange {...args} />
</Template>

<Story name="Basic Usage" let:args>
	<DateRange {...args} name="dateRange" />
	<h1>Input Store: {$inputStore.dateRange.start} - {$inputStore.dateRange.end}</h1>
</Story>

<Story name="Single presetRanges" args={{ presetRanges: 'last7Days' }} />

<Story
	name="Multiple presetRanges"
	args={{ presetRanges: ['last7Days', 'last3Months', 'lastYear', 'allTime'] }}
/>

<Story
	name="Multiple presetRanges without camelCase format"
	args={{ presetRanges: ['Last Month', 'Last7Days', 'lastyear', 'ALLTIME'] }}
/>

<Story name="Default Value" args={{ defaultValue: 'last Month' }} />
