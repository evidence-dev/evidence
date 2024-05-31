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

<Story name="omitGroup" args={{ omitGroup: 'Days' }} />

<Story name="Multiple omitGroup" args={{ omitGroup: 'Days, TO DATE' }} />
