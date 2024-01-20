<script>
	import {
		Clipboard,
		GripVertical,
		Icon,
		TrashX,
		Pencil
	} from '@evidence-dev/component-utilities/icons';
	import { toasts } from '@evidence-dev/component-utilities/stores';
	import { Button } from '../../atoms/button';
	import { blockToMarkdown } from './blocks';
	import { createEventDispatcher, getContext } from 'svelte';
	/** @type {import("./+page.svelte").Block} */
	export let block;

	/** @type {Array<{title: string, data: import("@evidence-dev/query-store").QueryStore}>} */
	export let queries;

	const dispatch = createEventDispatcher();

	function copy(md) {
		navigator.clipboard.writeText(md);
		toasts.add({
			message: 'Copied as markdown'
		});
	}

	const readonly = getContext('__adhoc_readonly');

	export let showControls = false;

	const sourceQueryChange = (e) => {
		const query = queries.find((q) => q.id === e.target.value);
		if (!query) return; // something is wrong
		block.source = query.id;
		block.sourceName = query.title;
	};
</script>

<div class="flex w-full gap-8 items-center">
	<div class="flex flex-1">
		{#if !readonly}
			<div class="handle w-4 mr-2 cursor-move"><Icon src={GripVertical} /></div>
		{/if}

		{#if block.type !== 'note'}
			<input
				disabled={readonly}
				class="flex-1 border-0 outline-none font-bold text-lg disabled:bg-white"
				bind:value={block.title}
			/>
		{/if}
	</div>
	{#if block.type === 'chart' && !readonly}
		<select
			value={block.source}
			on:change={sourceQueryChange}
			class="flex-shrink border border-gray-300 bg-white rounded-lg p-1 mt-2 px-2 pr-5 flex flex-row items-center bg-transparent cursor-pointer bg-right bg-no-repeat"
			style="background-image: url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' class=\'icon icon-tabler icon-tabler-chevron-down\' width=\'18\' height=\'18\' viewBox=\'0 0 24 24\' stroke-width=\'2\' stroke=\'currentColor\' fill=\'none\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath stroke=\'none\' d=\'M0 0h24v24H0z\' fill=\'none\'/%3E%3Cpath d=\'M6 9l6 6l6 -6\' /%3E%3C/svg%3E');"
		>
			<option disabled>Select a source query</option>
			{#each queries as query}
				<option value={query.id}>{query.title}</option>
			{/each}
		</select>
	{/if}
	{#if !readonly}
		<div class="flex h-8">
			<Button variant="error" icon={TrashX} on:click={() => dispatch('remove')} />
			<Button icon={Clipboard} on:click={() => copy(blockToMarkdown(block))} />
			<Button icon={Pencil} on:click={() => (showControls = !showControls)} />
		</div>
	{/if}
</div>

<!--
    We use a slot here so that showControls can be passed along
-->
<slot {showControls} toggleControls={() => (showControls = !showControls)} />
