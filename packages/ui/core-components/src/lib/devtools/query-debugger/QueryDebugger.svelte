<script>
	import MetaData from './sections/Metadata.svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import StateOverview from './sections/StateOverview.svelte';
	import DataPreview from './sections/DataPreview.svelte';
	import QueryText from './sections/QueryText.svelte';
	import Portal from '../../unsorted/ui/Portal.svelte';
	import Columns from './sections/Columns.svelte';
	import Verbose from './sections/Verbose.svelte';

	export let query;
	// @ts-expect-error globalThis isn't defined
	$: window['currentQuery'] = query;

	onMount(() => {
		document.body.classList.add('overflow-hidden');
		return () => document.body.classList.remove('overflow-hidden');
	});

	const dispatch = createEventDispatcher();

	onMount(() => {
		/**
		 * @param {KeyboardEvent} e
		 */
		const keybind = (e) => {
			if (e.key === 'Escape') {
				dispatch('close');
				e.stopPropagation();
			}
		};
		document.addEventListener('keydown', keybind);
		return () => document.removeEventListener('keydown', keybind);
	});
</script>

<Portal target={document.body}>
	{#if query}
		<div class="bg-gray-100 w-screen h-screen overflow-y-auto fixed top-12 left-0 select-text z-50">
			<header class="flex justify-between px-8">
				<div class="pt-4">
					<h2 class="font-bold text-xl">Query Inspector</h2>
					<p class="text-sm font-medium">Query ID: {query.id}</p>
					<p class="text-sm font-medium">Query Hash: {query.hash}</p>
				</div>
				<button on:click={() => dispatch('close')}> Close </button>
			</header>
			<div class="px-8 py-4 flex-col gap-8 bg-inherit grid grid-cols-12">
				<div class="col-span-6 bg-inherit flex flex-col gap-4 h-fit overflow-x-auto pt-4">
					<MetaData {query} />
					<StateOverview {query} />
					<Columns {query} />
					<DataPreview {query} />
					<Verbose {query} />
				</div>
				<div class="col-span-6 bg-inherit overflow-x-auto pt-4">
					<QueryText {query} />
				</div>
			</div>
		</div>
	{/if}
</Portal>
