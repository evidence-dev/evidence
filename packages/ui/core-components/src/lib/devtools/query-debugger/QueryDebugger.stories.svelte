<script context="module">
	/** @type {import("@storybook/svelte").Meta} */
	export const meta = {
		title: 'QueryDebugger',
		component: QueryDebugger
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import SqlConsole from '../../molecules/sql-console/SqlConsole.svelte';
	import QueryDebugger from './QueryDebugger.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import { userEvent, within } from '@storybook/test';

	let selectedQuery;
</script>

<!-- TODO Prism syntax highlighting doesn't work in this story because we aren't loading prismtheme.css -->

<Story
	name="Basic Usage"
	play={async ({ canvasElement }) => {
		const screen = within(canvasElement);
		const button = await screen.findByRole('button', { name: 'Open' });
		await userEvent.click(button);
	}}
>
	{@const data = Query.create(`SELECT 1, 2, 3 from my_table order by 1 asc`, query)}

	<button on:click={() => (selectedQuery = data)}>Open</button>

	<QueryDebugger query={selectedQuery} on:close={() => (selectedQuery = undefined)}>
		<SqlConsole />
	</QueryDebugger>
</Story>
