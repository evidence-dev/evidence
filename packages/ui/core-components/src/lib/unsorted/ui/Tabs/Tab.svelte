<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext, onDestroy, onMount } from 'svelte';
	import { nanoid } from 'nanoid';
	import TabDisplay from './TabDisplay.svelte';

	/**
	 * @type {string}
	 */
	export let label;
	/**
	 * @type {string}
	 */
	export let id;
	$: id = id ?? label;

	/**
	 * @type {boolean}
	 */
	export let selected;

	const internalId = nanoid();

	/** @type {import('./index.d.ts').TabsContext} */
	const context = getContext('TABS_STORE');

	const addTabToContext = () => {
		$context.tabs = [
			...$context.tabs.filter((t) => t.internalId !== internalId),
			{ internalId, id, label }
		];

		if (selected) {
			$context.activeId = id;
		}
	};

	// Add tab to context
	$: if (id && label) {
		addTabToContext();
	}

	// Update selected when the active tab changes
	onMount(() => {
		return context.subscribe(({ activeId }) => {
			selected = activeId === id;
		});
	});

	// Ensure that tabs remove themselves correctly when they are unmounted.
	// Otherwise they will still exist but will never render content.
	onDestroy(() => {
		$context.tabs = $context.tabs.filter((t) => t.internalId !== internalId);
	});

	const color = $context.color;
</script>

{#if !$context.printing || !$context.printShowAll}
	{#if selected}
		<div class="mb-5">
			<slot />
		</div>
	{/if}
{:else}
	<nav class="my-6 flex flex-wrap gap-x-1 gap-y-1 border-b">
		{#each $context.tabs as tab}
			<TabDisplay id={tab.id} label={tab.label} activeId={id} {color}>
				<slot />
			</TabDisplay>
		{/each}
	</nav>
	<div class="text-base">
		<slot />
	</div>
{/if}
