<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { onMount, setContext } from 'svelte';
	import { writable } from 'svelte/store';

	const classes = {
		notActive: 'text-gray-600 hover:text-gray-800 hover:bg-gray-200',
		active: 'text-black border-b-2 border-[--borderColor] bg-[--bgColor]'
	};

	/**
	 * id can be provided to enable tab selection to persist across reloads (e.g. with query params)
	 * @type {string}
	 */
	export let id;

	/**
	 * color can be provided to set custom background color for active tab.
	 * @type {string}
	 */
	export let color = 'hsla(207, 65%, 39%, 1)';
	color = color.replace(/\s+/g, ''); // clean string

	const bgColor = isValidColorString(color) ? addOpacityToColor(color) : 'hsla(207, 65%, 39%, 0.1)';
	const borderColor = isValidColorString(color) ? color : 'hsla(207, 65%, 39%, 1)';

	function isHex(inputColor) {
		const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/i;
		return hexRegex.test(inputColor);
	}

	function isRGB(inputColor) {
		const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
		return rgbRegex.test(inputColor);
	}

	function isHSL(inputColor) {
		const hslRegex = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3}%)\s*,\s*(\d{1,3}%)\s*\)$/i;
		return hslRegex.test(inputColor);
	}

	function isValidColorString(inputColor) {
		return isHex(inputColor) || isRGB(inputColor) || isHSL(inputColor);
	}

	function addOpacityToColor(colorString) {
		if (isHex(colorString)) {
			return colorString + '1a';
		} else if (isRGB(colorString) || isHSL(colorString)) {
			return colorString.replace(/(\)|\s|$)/, ', 0.1$1');
		}
	}

	/** @type {import('./index.d.ts').TabsContext} */
	const context = writable({ tabs: [], active: null });

	onMount(() => {
		const url = new URL(window.location.href);
		const urlActive = url.searchParams.get(id);
		if (urlActive) {
			$context.active = urlActive;
		}
	});

	// Select the first tab by default
	$: if (!$context.activeId && $context.tabs.length) {
		$context.activeId = $context.tabs[0].id;
	}

	// Select the first tab when the active tab no longer exists
	$: if (!$context.tabs.find((t) => t.id === $context.activeId)) {
		$context.activeId = $context.tabs[0]?.id;
	}

	$: if ($context.activeId && id) {
		// Keep the Query in sync
		const url = new URL(window.location.href);
		url.searchParams.set(id, $context.activeId);
		history.replaceState({}, '', url);
	}

	setContext('TABS_STORE', context);
</script>

<section>
	<nav class="my-6 flex flex-wrap gap-x-4 gap-y-1">
		{#each $context.tabs as tab}
			<button
				style:--bgColor={bgColor}
				style:--borderColor={borderColor}
				on:click={() => ($context.activeId = tab.id)}
				class="mt-2 p-2 rounded-t flex-1 text-sm font-sans whitespace-nowrap transition duration-200 ease-in active:bg-gray-100 {$context.activeId ===
				tab.id
					? classes.active
					: classes.notActive} "
			>
				{tab.label}
			</button>
		{/each}
	</nav>
	<div class="text-base">
		<slot />
	</div>
</section>
