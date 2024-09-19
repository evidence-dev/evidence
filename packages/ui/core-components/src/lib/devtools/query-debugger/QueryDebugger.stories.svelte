<script context="module">
	/** @type {import("@storybook/svelte").Meta} */
	export const meta = {
		title: 'QueryDebugger',
		component: QueryDebugger,
		parameters: {
			chromatic: { disableSnapshot: true }
		}
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import SqlConsole from '../../molecules/sql-console/SqlConsole.svelte';
	import QueryDebugger from './QueryDebugger.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import { userEvent, within } from '@storybook/test';

	const mockQuery = new Proxy(Query.create(`SELECT 1`, query), {
		get: (target, prop) => {
			if (prop === 'id') return 'mockQueryId';
			return target[prop];
		}
	});

	let selectedQuery = undefined;
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
	<button on:click={() => (selectedQuery = mockQuery)}>Open</button>

	<QueryDebugger query={selectedQuery} on:close={() => (selectedQuery = undefined)}>
		<SqlConsole />
	</QueryDebugger>
</Story>
