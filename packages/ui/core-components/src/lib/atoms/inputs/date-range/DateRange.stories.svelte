<script context="module">
	import WithScopedInputStore from '../../../storybook-helpers/WithScopedInputStore.svelte';
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Atoms/inputs/DateRange',
		argTypes: {},
		args: {
			title: 'Date Range, Including Presets',
			name: 'dateRange',
			omitGroup: []
		},
		decorators: [() => WithScopedInputStore]
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';
	import DateRange from './DateRange.svelte';
</script>

<Template let:args>
	<DateRange {...args} />
</Template>

<Story name="Basic Usage" let:args>
	<DateRange {...args} />
</Story>

<Story name="Single presetRanges" args={{ presetRanges: ['last7Days'] }} />

<Story
	name="Multiple presetRanges"
	args={{ presetRanges: ['last7Days', 'last3Months', 'lastYear', 'allTime'] }}
/>

<Story
	name="Multiple presetRanges that are not present"
	args={{ presetRanges: ['Last Month', 'Last7Days', 'lastyear', 'ALLTIME'] }}
/>

<Story name="Default Value" args={{ defaultValue: 'lastMonth' }} />
