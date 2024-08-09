<script context="module">
	export const evidenceInclude = true;

	/** @type {import("@evidence-dev/sdk/usql").QueryDebugValue['proxied'][]} */
	const ssrQueries = [];

	Query.addEventListener('queryCreated', (q) => ssrQueries.push(q.proxied));
</script>

<script>
	import { derived, get } from 'svelte/store';
	import { Query } from '@evidence-dev/sdk/usql';
	import MetaData from './sections/Metadata.svelte';
	import { onMount } from 'svelte';
	import StateOverview from './sections/StateOverview.svelte';
	import DataPreview from './sections/DataPreview.svelte';
	import QueryText from './sections/QueryText.svelte';
	import QueryDebugRow from './QueryDebugRow.svelte';
	import Portal from '../../unsorted/ui/Portal.svelte';
	import { slide } from 'svelte/transition';
	import clickoutside from '@evidence-dev/component-utilities/clickOutside';
	import Columns from './sections/Columns.svelte';
	import Verbose from './sections/Verbose.svelte';

	export let scopedOnly = false;

	/** @type {import("svelte/store").Readable< import("@evidence-dev/sdk/usql").QueryDebugValue['proxied'][] >}*/
	let allQueries = derived([], (v) => v);

	/** @param {import("@evidence-dev/sdk/usql").QueryDebugValue} query */
	const trackQueries = (query) => {
		// TODO: Handle narrow containers
		// TODO: Include a trace of where the query was created
		let included = [...get(allQueries), query.proxied];
		if (!scopedOnly) included = [...ssrQueries, ...included];

		allQueries = derived(Array.from(new Set(included)), (v) => v);
	};

	let selected;
	// @ts-expect-error globalThis isn't defined
	$: window['currentQuery'] = selected;

	Query.addEventListener('queryCreated', trackQueries);
	onMount(() => {
		return () => Query.removeEventListener('queryCreated', trackQueries);
	});
	let queryTarget;
	let open = false;
	$: if (selected) {
		document.body.classList.add('overflow-hidden');
	} else {
		document.body.classList.remove('overflow-hidden');
	}
</script>

<Portal target={document.body}>
	<div
		class="fixed bottom-0 right-4 z-50 flex flex-col w-96"
		use:clickoutside={{ enabled: true, callback: () => (open = false) }}
	>
		{#if open}
			<section class="p-4 font-mono min-w-80 right-0 top-0" transition:slide>
				<!-- <h2 class="font-bold text-xl">Query Debugger</h2> -->
				<!-- Note that this should not be used in production as it has negative side effects -->
				<section>
					{#each $allQueries as query}
						<div
							class:bg-gray-200={selected?.id === query.id && selected?.hash === query.hash}
							class:odd:bg-gray-100={selected?.id !== query.id}
						>
							<QueryDebugRow
								on:select={(e) => {
									selected === e.detail ? (selected = null) : (selected = e.detail);
									open = false;
								}}
								{query}
							/>
						</div>
					{/each}
				</section>
			</section>
		{/if}
		<button
			class="h-12 flex gap-2 justify-center items-center self-end"
			on:click={() => (open = !open)}
		>
			<p>Query Inspector</p>
		</button>
	</div>
</Portal>

<div>
	<div class="fixed bottom-0 left-0 z-50 w-full" bind:this={queryTarget} />
	<slot />
</div>

<Portal target={document.body}>
	{#if selected}
		<div class="bg-gray-100 w-screen h-screen overflow-y-auto fixed top-12 left-0 select-text z-40">
			<header class="flex justify-between px-8">
				<div class="pt-4">
					<h2 class="font-bold text-xl">Query Inspector</h2>
					<p class="text-sm font-medium">Query ID: {selected.id}</p>
					<p class="text-sm font-medium">Query Hash: {selected.hash}</p>
				</div>
				<button on:click={() => (selected = null)}> Close </button>
			</header>
			<div class="px-8 py-4 flex-col gap-8 bg-inherit grid grid-cols-12">
				<div class="col-span-6 bg-inherit flex flex-col gap-4 h-fit overflow-x-auto pt-4">
					<MetaData query={selected} />
					<StateOverview query={selected} />
					<Columns query={selected} />
					<DataPreview query={selected} />
					<Verbose query={selected} />
				</div>
				<div class="col-span-6 bg-inherit overflow-x-auto pt-4">
					<QueryText query={selected} />
				</div>
			</div>
		</div>
	{/if}
</Portal>
