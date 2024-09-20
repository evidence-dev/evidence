<script context="module">
	import Tabs from './Tabs.svelte';

	export const meta = {
		title: 'UI/Tabs',
		component: Tabs
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import { Query } from '@evidence-dev/sdk/usql';
	import Tab from './Tab.svelte';
	import TextInput from '../../../atoms/inputs/text/TextInput.svelte';
	import { within, userEvent } from '@storybook/testing-library';
	import { expect } from '@storybook/jest';
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	import QueryLoad from '../../../atoms/query-load/QueryLoad.svelte';

	const inputStore = getInputContext();
</script>

<Story name="Basic Usage">
	<Tabs>
		<Tab label="Tab 1" id="tab1">Tab 1 content</Tab>
		<Tab label="Tab 2" id="tab2">Tab 2 content</Tab>
		<Tab label="Tab 3" id="tab3">Tab 3 content</Tab>
	</Tabs>
</Story>

<Story name="Generated from a query">
	{@const data = Query.create(
		`
      SELECT tag
      FROM hashtags
      ORDER BY tag
      ${$inputStore.offset?.toString() ? `OFFSET ${$inputStore.offset.toString()}` : ``}
      LIMIT 3
    `,
		query
	)}
	<TextInput name="offset" title="Offset" />

	<Tabs>
		<QueryLoad {data} let:loaded>
			{#each loaded as row}
				{@const tag = row.tag}
				<Tab label={tag}>
					{tag}
				</Tab>
			{/each}
		</QueryLoad>
	</Tabs>
</Story>

<Story
	name="Click on a second tab"
	play={async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Wait for the component to render
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Find the second tab by its id
		const secondTab = canvas.getByRole('button', { name: 'Tab 2' });

		// Click on the second tab
		await userEvent.click(secondTab);

		// Check if the second tab's content is visible
		const secondTabContent = canvas.getByText('Tab 2 content');
		expect(secondTabContent).toBeVisible();
	}}
>
	<Tabs>
		<Tab label="Tab 1" id="tab1">Tab 1 content</Tab>
		<Tab label="Tab 2" id="tab2">Tab 2 content</Tab>
		<Tab label="Tab 3" id="tab3">Tab 3 content</Tab>
	</Tabs>
</Story>

<Story name="Tabs w/ id">
	<Tabs id>
		<Tab label="Tab 1" id="tab1">Tab 1 content</Tab>
		<Tab label="Tab 2" id="tab2">Tab 2 content</Tab>
		<Tab label="Tab 3" id="tab3">Tab 3 content</Tab>
	</Tabs>
</Story>

<Story name="Tabs w/ multiple id">
	<Tabs id="first-set">
		<Tab label="Tab 1" id="tab1">Tab 1 content</Tab>
		<Tab label="Tab 2" id="tab2">Tab 2 content</Tab>
		<Tab label="Tab 3" id="tab3">Tab 3 content</Tab>
	</Tabs>
	<Tabs id="second-set">
		<Tab label="Tab 4" id="tab4">Tab 4 content</Tab>
		<Tab label="Tab 4" id="tab5">Tab 5 content</Tab>
		<Tab label="Tab 6" id="tab6">Tab 6 content</Tab>
	</Tabs>
</Story>
