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
	// Mock "today"
	import MockDate from 'mockdate';
	MockDate.set('2024-06-19');
</script>

<Template let:args>
	<DateRange {...args} />
</Template>

<Story name="Basic Usage" let:args>
	<DateRange {...args} />
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

<Story
	name="Last 365 Days"
	args={{ presetRanges: ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'Last 365 Days'] }}
/>
