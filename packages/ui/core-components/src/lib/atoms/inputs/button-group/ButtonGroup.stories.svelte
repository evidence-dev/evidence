<script context="module">
	export const meta = {
		title: 'Atoms/inputs/ButtonGroup',
		component: ButtonGroup,
		args: { title: 'Group of buttons', name: 'buttonGroup' }
	};
</script>

<script>
	import { Meta, Template, Story } from '@storybook/addon-svelte-csf';
	import ButtonGroup from './ButtonGroup.svelte';
	import ButtonGroupItem from './ButtonGroupItem.svelte';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { fakerSeries } from '$lib/faker-data-queries.js';
	// From layout.js
	const inputStore = writable({});
	setContext(INPUTS_CONTEXT_KEY, inputStore);
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

	Current Value: {$inputStore[args.name]}
</Story>

<Story name="Large Number of Entries " let:args>
	<div class="mb-8">
		<ButtonGroup {...args}>
			{#each Array.from({ length: 20 }, (_, i) => i) as item}
				<ButtonGroupItem valueLabel={`Option ${item}`} value={item} />
			{/each}
		</ButtonGroup>
	</div>

	Current Value: {$inputStore[args.name]}
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

	Current Value: {$inputStore[args.name]}
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

	Current Value: {$inputStore[args.name]}
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

	Current Value: {$inputStore[args.name]}
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

	Current Value: {$inputStore[args.name]}
</Story>

<Story name="Preset - Date Agg" let:args>
	<div class="mb-8">
		<ButtonGroup {...args} preset="dates" />
	</div>

	Current Value: {$inputStore[args.name]}
</Story>

<Story name="Default Value" let:args>
	<div class="mb-8">
		<ButtonGroup {...args}>
			<ButtonGroupItem valueLabel="Option 1" value="option_1" />
			<ButtonGroupItem valueLabel="Option 2" value="option_2" default />
			<ButtonGroupItem valueLabel="Option 3" value="option_3" />
		</ButtonGroup>
	</div>

	Current Value: {$inputStore[args.name]}
</Story>
