<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { onMount, setContext } from 'svelte';
	import { writable } from 'svelte/store';

	/**
	 * id can be provided to enable tab selection to persist across reloads (e.g. with query params)
	 * @type {string}
	 */
	export let id;

	/**
	 * color sets the background color for the active tab button.
	 * @type {string}
	 */
	export let color = 'rgb(230, 246,255)'; // or '#ef562f' or 'hsl(12, 86%, 56%)'

	/**
	 * @type {import("svelte/store").Writable<{ tabs: {label: string, id: string}[], active: string, tabsId: string}>}
	 */
	const tabItems = writable({ tabs: [], active: null });

	onMount(() => {
		const url = new URL(window.location.href);
		const urlActive = url.searchParams.get(id);
		if (urlActive) {
			$tabItems.active = urlActive;
		}
	});

	$: if (!$tabItems.active && $tabItems.tabs.length)
		// Select the first tab by default
		$tabItems.active = $tabItems.tabs[0].id;

	$: if ($tabItems.active && id) {
		// Keep the Query in sync
		const url = new URL(window.location.href);
		url.searchParams.set(id, $tabItems.active);
		history.replaceState({}, '', url);
	}

	setContext('TAB_REGISTRATION', tabItems);
</script>

<section>
	<nav class="my-6 flex flex-wrap gap-x-4 gap-y-1">
		{#each $tabItems.tabs as tab}
			<button
				style="--activeTabColor:{color}"
				on:click={() => ($tabItems.active = tab.id)}
				class="p-4 rounded-t flex-1 text-sm font-sans whitespace-nowrap transition duration-300 ease-in"
				class:active={$tabItems.active === tab.id}
			>
				{tab.label}
			</button>
		{/each}
	</nav>
	<div class="p-5 text-base">
		<slot />
	</div>
</section>

<style lang="postcss">
	nav button:not(.active) {
		@apply text-gray-400 hover:bg-gray-200 hover:text-gray-600 active:bg-gray-50;
	}

	button.active {
		@apply border-b-2 bg-[var(--activeTabColor)] text-black active:bg-gray-50 border-blue-200;
	}
</style>
