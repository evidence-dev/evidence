<script>
	import { afterNavigate } from '$app/navigation';
	import { fly, scale } from 'svelte/transition';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Bug, X } from '@steeze-ui/tabler-icons';
	import { Accordion, AccordionItem } from '../atoms/accordion/index.js';
	import QueryDebugger, { queries, resetQueries } from './query-debugger/QueryDebugger.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { onMount } from 'svelte';
	import InputState from './input-debug/InputState.svelte';
	import InputHistory from './input-debug/InputHistory.svelte';
	import { isDebug } from '@evidence-dev/sdk/utils';
	import { ensureInputContext } from '@evidence-dev/sdk/utils/svelte';
	import { writable } from 'svelte/store';
	import { getReadonlyInputContext } from '@evidence-dev/sdk/utils/svelte';
	import { History } from '@evidence-dev/sdk/utils';

	ensureInputContext(writable({}));

	let open = false;

	let selectedQuery;
	afterNavigate(() => {
		// Whenever we change pages, we can release the queries
		resetQueries();
	});

	onMount(() => {
		/**
		 * @param {KeyboardEvent} e
		 */
		const keybind = (e) => {
			if (e.key === 'Escape') {
				open = false;
				e.stopPropagation();
			}
			if (e.key.toLowerCase() === 'e' && e.shiftKey && (e.ctrlKey || e.metaKey)) {
				open = true;
				e.stopPropagation();
			}
		};
		window.addEventListener('keydown', keybind);
		return () => window.removeEventListener('keydown', keybind);
	});

	const inputs = getReadonlyInputContext();

	/** @type {History}*/
	const inputHistory = new History();
	$: inputHistory.push($inputs);
</script>

{#if open}
	<div
		class="h-[calc(100vh-3rem)] w-96 bg-gray-200 fixed overflow-auto right-0 top-12 px-4 py-4 z-10"
		transition:fly={{ x: 384, duration: 250, delay: 0 }}
	>
		<button
			class="absolute right-4 top-4 rounded-full bg-blue-400 w-8 h-8 flex items-center justify-center hover:bg-blue-300 z-30"
			on:click={() => (open = !open)}
		>
			<Icon src={open ? X : Bug} class="w-4 h-4" />
		</button>

		<header class="text-xl font-bold mb-4">Evidence Dev Tools</header>

		<Accordion>
			<AccordionItem title="Inspect Queries" compact>
				<section class="">
					{#each $queries.entries() as [id, query] (id)}
						<button
							class="flex justify-between w-full odd:bg-black/10 hover:bg-black/20"
							class:odd:bg-red-300={query.error}
							class:bg-red-400={query.error}
							class:hover:bg-red-500={query.error}
							class:odd:bg-yellow-300={query.opts?.noResolve}
							class:bg-yellow-400={query.opts?.noResolve}
							class:hover:bg-yellow-500={query.opts?.noResolve}
							on:click={() => (selectedQuery = query)}
						>
							<p class="w-full text-left truncate">{query.id}</p>
							<p class="w-full text-right">{query.hash}</p>
						</button>
					{/each}
				</section>

				{#if Query.isQuery(selectedQuery)}
					<QueryDebugger query={selectedQuery} on:close={() => (selectedQuery = null)} />
				{/if}
			</AccordionItem>
			<AccordionItem title="Inspect Inputs" compact>
				<InputState history={inputHistory} />
			</AccordionItem>
			<AccordionItem title="View Input History" compact>
				<InputHistory history={inputHistory} />
			</AccordionItem>
		</Accordion>
	</div>
{/if}

{#if isDebug()}
	<button
		transition:scale={{ axis: 'x' }}
		class="fixed right-4 top-16 rounded-full bg-blue-400 w-8 h-8 flex items-center justify-center hover:bg-blue-300 z-0"
		on:click={() => (open = !open)}
	>
		<Icon src={Bug} class="w-4 h-4" />
	</button>
{/if}
<slot />
