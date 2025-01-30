<script context="module">
	/** @type {import('@storybook/addon-svelte-csf').MetaProps}*/
	export const meta = {
		title: 'charts/CalendarHeatmap',
		component: CalendarHeatmap,
		argTypes: {
			min: {
				control: 'number'
			},
			max: {
				control: 'number'
			},
			emptySet: {
				control: 'select',
				options: ['pass', 'warn', 'error']
			},
			emptyMessage: {
				control: 'text'
			},
			colorPalette: {
				control: 'text'
			},
			valueFmt: {
				control: 'text'
			},
			yearLabel: {
				control: 'boolean'
			},
			monthLabel: {
				control: 'boolean'
			},
			dayLabel: {
				control: 'boolean'
			},
			title: {
				control: 'text'
			},
			subtitle: {
				control: 'text'
			},
			chartAreaHeight: {
				control: 'number'
			},
			legend: {
				control: 'boolean'
			},
			filter: {
				control: 'boolean'
			},
			renderer: {
				control: 'select',
				options: ['canvas', 'svg']
			},
			downloadableData: {
				control: 'boolean'
			},
			downloadableImage: {
				control: 'boolean'
			}
		}
	};

	const data = Query.create(`SELECT departure_date, fare FROM flights limit 500`, query);
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import CalendarHeatmap from './CalendarHeatmap.svelte';
</script>

<Story name="Basic date and value" let:args>
	<CalendarHeatmap {data} {...args} date="departure_date" value="fare" />
</Story>
<Story name="custom color palette" let:args>
	<CalendarHeatmap
		{data}
		{...args}
		date="departure_date"
		value="fare"
		colorPalette={['navy', 'lightyellow', 'purple']}
	/>
</Story>
<Story name="Missing column" let:args>
	<CalendarHeatmap {data} {...args} date="departure_date" value={undefined} />
</Story>
