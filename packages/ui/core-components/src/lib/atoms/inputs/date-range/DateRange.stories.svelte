<script context="module">
	export const meta = {
		title: 'Atoms/inputs/DateRange',
		component: DateRange,
		argTypes: {},
		args: {
			title: 'Date Range, Including Presets',
			name: 'dateRange'
		},
		decorators: [() => WithScopedInputStore]
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';
	import DateRange from './DateRange.svelte';
	import WithScopedInputStore from '$lib/storybook-helpers/WithScopedInputStore.svelte';
</script>

<Template let:args>
	<DateRange {...args} />
</Template>

<Story name="Basic Usage" let:args>
	<DateRange {...args} />
</Story>
