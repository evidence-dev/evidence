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
			}
		}
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import USMap from './USMap.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	/** @type {typeof query} */
	const slowQuery = async (...args) => {
		await new Promise((resolve) => setTimeout(resolve, 3_000));
		return query(...args);
	};
</script>

<Story name="Basic Usage" let:args>
	{@const data = Query.create(`SELECT * from state_sales`, query)}
	<USMap {data} {...args} state="state" value="sales" />
</Story>

<Story name="Loading" let:args>
	{@const data = Query.create(`SELECT * from state_sales`, slowQuery)}
	<USMap {data} {...args} state="state" value="sales" />
</Story>

<Story name="No Abb" let:args>
	{@const data = Query.create(`SELECT * from state_sales`, query)}
	<USMap {data} {...args} state="state" value="sales" abbreviations="false" />
	<USMap {data} {...args} state="state" value="sales" abbreviations={false} />
</Story>
