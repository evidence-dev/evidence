<script context="module">
	import WithScopedInputStore from '../../../storybook-helpers/WithScopedInputStore.svelte';
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Atoms/inputs/ButtonGroup',
		argTypes: {},
		args: {
			title: 'Group of buttons',
			name: 'buttonGroup',
			omitGroup: []
		},
		decorators: [() => WithScopedInputStore]
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';
	import ButtonGroup from './ButtonGroup.svelte';
	import ButtonGroupItem from './ButtonGroupItem.svelte';
	import { fakerSeries } from '$lib/faker-data-queries.js';
	import Tab from '$lib/unsorted/ui/Tabs/Tab.svelte';
	import Tabs from '$lib/unsorted/ui/Tabs/Tabs.svelte';
</script>

<Template let:args>
	<div class="h-64">
		<ButtonGroup {...args}>
			<slot />
		</ButtonGroup>
		<p class="font-bold text-lg mt-4">Output Attributes</p>
	</div>
</Template>

<Story name="Hard Coded Entries" let:args>
	<div class="mb-8">
		<ButtonGroup {...args}>
			<ButtonGroupItem valueLabel="Option 1" value={1} />
			<ButtonGroupItem valueLabel="Option 2" value={2} />
			<ButtonGroupItem valueLabel="Option 3" value={3} />
			<ButtonGroupItem valueLabel="Option 4" value={4} />
		</ButtonGroup>
	</div>
</Story>

<Story name="Large Number of Entries " let:args>
	<div class="mb-8">
		<ButtonGroup {...args}>
			{#each Array.from({ length: 20 }, (_, i) => i) as item}
				<ButtonGroupItem valueLabel={`Option ${item}`} value={item} />
			{/each}
		</ButtonGroup>
	</div>
</Story>

<Story
	name="Query-Based Entries - Text"
	let:args
	args={{
		data: 'hashtags',
		value: 'id',
		label: 'tag'
	}}
>
	<div class="mb-8">
		<ButtonGroup {...args} />
	</div>
</Story>

<Story
	name="Query-Based Entries - Existing Store"
	let:args
	args={{
		data: fakerSeries.social_media.hashtags.store,
		value: 'id',
		label: 'tag'
	}}
>
	<div class="mb-8">
		<ButtonGroup {...args} />
	</div>
</Story>

<Story
	name="Mixed Entries - Text"
	let:args
	args={{
		data: 'hashtags',
		value: 'id',
		label: 'tag'
	}}
>
	<div class="mb-8">
		<ButtonGroup {...args}>
			<ButtonGroupItem valueLabel="Option 1" value="option_1" />
			<ButtonGroupItem valueLabel="Option 2" value="option_2" />
		</ButtonGroup>
	</div>
</Story>

<Story
	name="Mixed Entries - Existing Store"
	let:args
	args={{
		data: fakerSeries.social_media.hashtags.store,
		value: 'id',
		label: 'tag'
	}}
>
	<div class="mb-8">
		<ButtonGroup {...args}>
			<ButtonGroupItem valueLabel="Option 1" value="option_1" />
			<ButtonGroupItem valueLabel="Option 2" value="option_2" />
		</ButtonGroup>
	</div>
</Story>

<Story name="Preset - Date Agg" let:args>
	<div class="mb-8">
		<ButtonGroup {...args} preset="dates" />
	</div>
</Story>

<Story name="Buttons with tabs" let:args>
	<Tabs>
		<Tab label="Tab 1">
			<div class="mb-8">
				<ButtonGroup {...args}>
					<ButtonGroupItem valueLabel="Option 1" value={1} />
					<ButtonGroupItem valueLabel="Option 2" value={2} />
					<ButtonGroupItem valueLabel="Option 3" value={3} />
					<ButtonGroupItem valueLabel="Option 4" value={4} />
				</ButtonGroup>
			</div>
		</Tab>
		<Tab label="Tab 2">
			<div class="mb-8">
				<ButtonGroup {...args} preset="dates" />
			</div>
		</Tab>
	</Tabs>
</Story>
