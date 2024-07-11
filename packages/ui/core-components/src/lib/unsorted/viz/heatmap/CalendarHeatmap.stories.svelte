<script context="module">
	/** @type {import('@storybook/addon-svelte-csf').MetaProps}*/
	export const meta = {
		title: 'charts/CalendarHeatmap',
		component: CalendarHeatmap,
	};
</script>

<script>
	import { writable } from 'svelte/store';
	import { setContext } from 'svelte';
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
    import CalendarHeatmap from './_CalendarHeatmap.svelte';


	const inputStore = writable({});
	setContext(INPUTS_CONTEXT_KEY, inputStore);
</script>

<Story
	name="Basic hardcoded x,y"
	args={{ x: 24, y: 514, label: 'Whoa look at this data!' }}
	argTypes={{ x: { control: 'number' }, y: { control: 'number' } }}
	let:args
>
	{@const data = Query.create(`SELECT * FROM numeric_series WHERE series='pink'`, query)}
	<LineChart x="x" y="y" {data}>
		<ReferencePoint {...args} />
	</LineChart>
</Story>

