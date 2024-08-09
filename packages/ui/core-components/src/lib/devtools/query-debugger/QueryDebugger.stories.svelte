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
</script>

<Story name="Basic Usage">
	<QueryDebugger>
		<SqlConsole />
	</QueryDebugger>
</Story>
