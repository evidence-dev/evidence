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
	export let color = '#268aed';
	color = color.replace(/\s+/g, '').toLowerCase(); // clean string

	const bgColor = isValidColorString(color) ? addOpacityToColor(color) : '#268aed1a';
	const borderColor = isValidColorString(color) ? color : '#268aed';

	function isValidColorString(inputColor) {
		const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
		const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
		const hslRegex = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3}%)\s*,\s*(\d{1,3}%)\s*\)$/;
		return hexRegex.test(inputColor) || rgbRegex.test(inputColor) || hslRegex.test(inputColor);
	}

	function addOpacityToColor(colorString) {
		if (colorString.startsWith('#')) {
			return colorString + '1a';
		} else if (colorString.startsWith('rgb(') || colorString.startsWith('rgba(')) {
			return colorString.replace(/(\)|\s|$)/, ', 0.1$1');
		} else if (colorString.startsWith('hsl(')) {
			return colorString.slice(0, -1) + ', 0.1)';
		}
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
				style:--bgColor={bgColor}
				style:--borderColor={borderColor}
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
		background-color: var(--bgColor);
		border-bottom: 2px solid var(--borderColor);
	}
</style>
