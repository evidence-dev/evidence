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
	 * activeTabColor sets background color of the active tab button.
	 * @type {string}
	 */
	export let activeTabColor = 'rgb(239, 86, 47)'; // or '#ef562f' or 'hsl(12, 86%, 56%)'

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
				style="--activeTabColor:{activeTabColor}"
				on:click={() => ($tabItems.active = tab.id)}
				class="p-4 rounded-lg flex-1 text-sm whitespace-nowrap font-sans font-medium transition duration-200 ease-in"
				class:active={$tabItems.active === tab.id}
			>
				{tab.label}
			</button>
		{/each}
	</nav>
	<div class="my-6 p-4 rounded-lg bg-gray-50 text-base text-gray-500">
		<slot />
	</div>
</section>

<style lang="postcss">
	nav button:not(.active) {
		@apply hover:bg-gray-100 hover:text-gray-600 text-gray-400;
	}

	button.active {
		@apply bg-[var(--activeTabColor)] text-white;
	}
</style>
