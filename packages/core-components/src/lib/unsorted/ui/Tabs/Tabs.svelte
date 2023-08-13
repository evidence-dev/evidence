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
	 * color can be provided to set custom background color for active tab.
	 * @type {string}
	 */
	export let color = '#268aed'; // or any 6 digit hex color code.
	const colorArray = hexToRgbArray(color);

	function hexToRgbArray(hexColor) {
		const hexDigits = hexColor.replace(/\s+/g, '').replace('#', '');

		// Check if the provided color contains valid hex characters.
		if (!/^[0-9a-fA-F]{6}$/.test(hexDigits)) {
			return null;
		}

		// Convert hex digit pairs to decimal RGB values.
		return [
			parseInt(hexDigits.slice(0, 2), 16), // R
			parseInt(hexDigits.slice(2, 4), 16), // G
			parseInt(hexDigits.slice(4, 6), 16) //  B
		];
	}

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
				style="--activeTabColor:{colorArray}"
				on:click={() => ($tabItems.active = tab.id)}
				class="mt-2 p-4 rounded-t flex-1 text-sm font-sans whitespace-nowrap transition duration-200 ease-in"
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
		@apply text-gray-400 hover:bg-gray-200 hover:text-gray-600 active:bg-gray-100;
	}

	button.active {
		@apply text-black active:bg-gray-100;
		background-color: rgba(var(--activeTabColor), 0.1);
		border-bottom: 2px solid rgba(var(--activeTabColor), 1);
	}
</style>
