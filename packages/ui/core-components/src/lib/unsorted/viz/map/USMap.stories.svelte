<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = { 
		title: 'Charts/USMap',
		argTypes: {
			downloadableData: {
				control: 'boolean',
				options: [true, false]
			},
			downloadableImage: {
				control: 'boolean',
				options: [true, false]
			},
		}
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import USMap from './USMap.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
</script>

<Story name="Basic Usage" let:args>
	{@const data = Query.create(`SELECT * from state_sales`, query)}
	<USMap {data} {...args}
		state="state" value="sales" />
</Story>
