<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext, onDestroy, onMount } from 'svelte';
	import { nanoid } from 'nanoid';

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

	/**
	 * @type {string | undefined}
	 */
	export let description = undefined;

	const internalId = nanoid();

	/** @type {import('./index.d.ts').TabsContext} */
	const context = getContext('TABS_STORE');

	const addTabToContext = () => {
		$context.tabs = [
			...$context.tabs.filter((t) => t.internalId !== internalId),
			{ internalId, id, label, description }
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
</script>

{#if selected}
	<slot />
{/if}
