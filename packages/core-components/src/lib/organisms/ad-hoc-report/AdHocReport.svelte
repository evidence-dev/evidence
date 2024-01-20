<script>
	import { afterUpdate, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Sortable from 'sortablejs';

	import { Share3, Clipboard } from '@steeze-ui/tabler-icons';

	import { Button } from '../../atoms/button';
	import { Alert } from '../../atoms/alert';
	import { toasts } from '@evidence-dev/component-utilities/stores';

	import { blockEditorComponents, serializeBlocks } from './blocks';
	import AddBlockMenu from './AddBlockMenu.svelte';
	import BlockHeader from './BlockHeader.svelte';
	import { LOCAL_STORAGE_KEY, setReadonly } from './constants.js';
	import { blockToMarkdown } from './blocks.js';

	/** @type {"localStorage" | "url" | undefined} */
	export let initialState = 'localStorage';

	/** @type {boolean} */
	export let persistToLocalStorage = true;

	/** @type {boolean} */
	export let persistToUrl = true;

	/** @type {boolean}*/
	export let readonly = false;
	// TODO: Reactive?
	setReadonly(readonly);

	/** @type {Array<import("./blocks.js").Block>} */
	let blocks = [];

	if (browser) {
		try {
			switch (initialState) {
				case 'localStorage':
					blocks = JSON.parse(atob(localStorage.getItem(LOCAL_STORAGE_KEY)));
					break;
				case 'url': {
					const urlBlocks = new URLSearchParams(window.location.search).get('report');

					blocks = JSON.parse(atob(urlBlocks));
					break;
				}
				default:
					blocks = [];
					break;
			}
		} catch (e) {
			toasts.add({ status: 'warning', message: 'Failed to load ad-hoc report' });
			blocks = [];
		}
	}

	/* TODO: Make sure query names are unique */
	/** @type {Array<{title: string, data: import("@evidence-dev/query-store").QueryStore}>} */
	let queries = [];

	$: queries = blocks.filter((block) => block.type === 'query');

	afterUpdate(() => {
		// Wait until the dom has updated, if there is an error; this won't run
		if (blocks && browser) {
			const serialized = serializeBlocks(blocks);
			if (persistToLocalStorage) localStorage.setItem(LOCAL_STORAGE_KEY, btoa(serialized));
			if (persistToUrl) {
				// let searchParams = new URLSearchParams(window.location.search);
				// searchParams.set("report", serialized);
				const url = new URL(window.location.href);
				url.searchParams.set('report', btoa(serialized));
				window.history.replaceState({}, '', url);
				// window.location.search = searchParams.toString();
			}
		}
	});

	let sortEl;
	onMount(() => {
		// Wire up sorting
		new Sortable(sortEl, {
			onEnd(evt) {
				const updatedBlocks = [];
				for (const child of evt.to.children) {
					const blockId = child.getAttribute('data-block-id');
					const block = blocks.find((block) => block.id === blockId);
					updatedBlocks.push(block);
				}
				blocks = updatedBlocks;
			},
			handle: '.handle'
		});
	});

	const share = () => {
		// Build Share URL
		const url = new URL(window.location.pathname, window.location.origin);
		url.searchParams.set('readonly', 'true');
		url.searchParams.set('report', btoa(serializeBlocks(blocks)));

		navigator?.clipboard?.writeText(url.toString());
		toasts.add({ message: 'Copied URL to clipboard!' });
	};

	const copyMd = () => {
		let out = blocks.map(blockToMarkdown).join('\n\n');
		navigator?.clipboard?.writeText(out);
		toasts.add({ message: 'Copied report to clipboard!' });
	};
</script>

<div class="flex flex-col gap-8 min-h-full">
	<div class="flex flex-col gap-4">
		<Alert status="warning">
			Ad-Hoc reporting is an experimental feature. You may need to reload the page in the event of
			an error
		</Alert>
		<!-- TODO: Show only on hover? -->
		<AddBlockMenu on:addBlock={({ detail }) => (blocks = [...blocks, detail])} />
		<div class="w-full flex justify-end gap-2">
			<Button on:click={share} icon={Share3} outline size="sm">Copy Report Link</Button>
			<Button on:click={copyMd} icon={Clipboard} outline size="sm">Copy as Evidence Markdown</Button
			>
		</div>
		<ul bind:this={sortEl}>
			{#each blocks as block (block.id)}
				<li class="bg-white px-2 py-1 rounded" data-block-id={block.id}>
					<BlockHeader
						bind:block
						{queries}
						on:remove={() => (blocks = blocks.filter(({ id }) => id !== block.id))}
						let:showControls
						let:toggleControls
					>
						<svelte:component
							this={blockEditorComponents[block.type]}
							on:toggleControls={toggleControls}
							bind:block
							{queries}
							{showControls}
						/>
					</BlockHeader>
				</li>
			{/each}
		</ul>
		{#if blocks.length}
			<AddBlockMenu on:addBlock={({ detail }) => (blocks = [...blocks, detail])} />
		{/if}
	</div>
</div>
