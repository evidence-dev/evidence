<script context="module">
	import Tabs from './Tabs.svelte';

	export const meta = {
		title: 'UI/Tabs',
		component: Tabs
	};
</script>

<script>
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { Story } from '@storybook/addon-svelte-csf';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import { Query } from '@evidence-dev/sdk/usql';
	import Tab from './Tab.svelte';
	import TextInput from '../../../atoms/inputs/text/TextInput.svelte';

	const inputStore = writable({});
	setContext(INPUTS_CONTEXT_KEY, inputStore);

	$: data = Query.create(
		`
      SELECT tag
      FROM hashtags
      ORDER BY tag
      ${$inputStore.offset?.toString() ? `OFFSET ${$inputStore.offset.toString()}` : ``}
      LIMIT 3
    `,
		query
	);
</script>

<Story name="Basic Usage">
	<Tabs>
		<Tab label="Tab 1" id="tab1">Tab 1 content</Tab>
		<Tab label="Tab 2" id="tab2">Tab 2 content</Tab>
		<Tab label="Tab 3" id="tab3">Tab 3 content</Tab>
	</Tabs>
</Story>

<Story name="Generated from a query">
	<TextInput name="offset" title="Offset" />

	<Tabs>
		{#each $data as row}
			{@const tag = row.tag}
			<Tab label={tag}>
				{tag}
			</Tab>
		{/each}
	</Tabs>
</Story>
