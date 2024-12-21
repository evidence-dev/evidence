<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { fade } from 'svelte/transition';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { InfoCircled } from '@steeze-ui/radix-icons';
	import { getThemeStores } from '../../themes/themes.js';
	import chroma from 'chroma-js';

	/** @type {import('@steeze-ui/svelte-icon').IconSource} */
	let icon = InfoCircled;

	export let description = '';

	export let size = 4;

	export let className = undefined;

	const { resolveColor } = getThemeStores();
	export let color = 'base-content-muted';
	$: colorStore = resolveColor(color);
	$: textColor = chroma($colorStore).css();

	let visible = false;
	let tooltipX = 0;
	let tooltipY = 0;

	// Show tooltip and calculate its position
	const showMessage = (event) => {
		const rect = event.target.getBoundingClientRect();
		tooltipX = rect.left + rect.width;
		tooltipY = rect.top - 0; // Slightly above the element
		visible = true;
	};

	// Hide tooltip
	const hideMessage = () => (visible = false);
</script>

<!-- Tooltip Trigger -->
<span
	on:focus={showMessage}
	on:blur={hideMessage}
	on:mouseenter={showMessage}
	on:mouseleave={hideMessage}
	style:--textColor={textColor}
	class="inline-block align-middle pb-0.5 pr-1 leading-4 cursor-helprelative w-fit {className}"
	role="tooltip"
>
	<slot name="handle">
		<Icon src={icon} class="w-{size} h-{size} text-[--textColor]" />
	</slot>
</span>

<!-- Tooltip -->
{#if visible}
	<div
		class="fixed whitespace-normal max-w-[200px] z-50 text-xs font-medium bg-base-200 shadow-sm border border-base-300 rounded py-1 px-2"
		style="top: {tooltipY}px; left: {tooltipX}px; "
		transition:fade
	>
		{description}
	</div>
{/if}
