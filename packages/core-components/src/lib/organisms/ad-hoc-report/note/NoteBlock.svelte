<script context="module">
	import showdown from 'showdown';

	const converter = new showdown.Converter({
		extensions: [
			{
				type: 'output',
				regex: /<([\w]+)(.*)>/gm,
				replace: `<$1 class="markdown" $2>`
			}
		],
		openLinksInNewWindow: true,
		strikethrough: true,
		ghCodeBlocks: true,
		headerLevelStart: 2,
		tables: true,
		tasklists: true
	});
</script>

<script>
	import { afterUpdate, createEventDispatcher } from 'svelte';

	/** @type {import("../blocks").Note} */
	export let block;
	if (!block.content) block.content = 'Write your notes here...';

	/** @type {boolean} */
	export let showControls = false;

	let htmlContent = converter.makeHtml(block.content ?? '');

	const dispatch = createEventDispatcher();

	afterUpdate(() => {
		htmlContent = converter.makeHtml(block.content);
	});
</script>

<div class="min-h-[12rem]">
	{#if showControls}
		<div class="grid grid-cols-2 gap-x-4">
			<!-- TODO: Codemirror? -->
			<textarea
				class="px-4 py-2 bg-gray-100"
				bind:value={block.content}
				on:blur={() => dispatch('toggleControls')}
			/>
			<div>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html htmlContent}
			</div>
		</div>
	{:else}
		<!-- TODO: on click or double click change to edit mode -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html htmlContent}
	{/if}
</div>
