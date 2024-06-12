<script>
	import { Meta, Template, Story } from '@storybook/addon-svelte-csf';
	import DateRange from './DateRange.svelte';
</script>

<Meta
	title="Atoms/inputs/DateRange"
	component={DateRange}
	argTypes={{}}
	args={{ title: 'Date Range, Including Presets', name: 'dateRange' }}
/>

<Template let:args>
	<DateRange {...args} />
</Template>

<Story name="Basic Usage" let:args>
	<DateRange {...args} />
</Story>
