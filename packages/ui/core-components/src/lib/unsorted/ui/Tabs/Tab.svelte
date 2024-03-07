<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext, onDestroy, onMount } from 'svelte';

	/**
	 * @type {string}
	 */
	export let label;
	/**
	 * @type {string}
	 */
	export let id = label;

	/**
	 * @type {boolean}
	 */
	export let selected;

	/**
	 * @type {import("svelte/store").Writable<{ tabs: {label: string, id: string}[], active: string, tabsId: string}>}
	 */
	const tabs = getContext('TAB_REGISTRATION');

	onMount(() => {
		$tabs.tabs = [...$tabs.tabs, { label, id }];
		if (selected) $tabs.active = id;
		// We are creating our subscription (instead of using $tabs) after handling the selected prop to make sure that
		// it is effective. Otherwise it would get set to false by our subscription and not work.
		// Returning a function from onMount is basically onDestroy; so we are also cleaning this up easily
		return tabs.subscribe(({ active }) => {
			selected = active === id;
		});
	});

	// Ensure that tabs remove themselves correctly when they are unmounted.
	// Otherwise they will still exist but will never render content.
	onDestroy(() => {
		$tabs.tabs = $tabs.tabs.filter((t) => t.id !== id);
		if ($tabs.active === id) {
			$tabs.active = $tabs.tabs[0]?.id;
		}
	});
</script>

{#if selected}
	<slot />
{/if}
