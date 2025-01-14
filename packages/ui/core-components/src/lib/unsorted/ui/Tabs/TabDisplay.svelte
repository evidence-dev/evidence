<script>
	import chroma from 'chroma-js';
	import { getThemeStores } from '../../../themes/themes.js';
	import Info from '../../ui/Info.svelte';

	const { resolveColor } = getThemeStores();

	export let color = 'base-content';
	$: colorStore = resolveColor(color);

	export let id;

	export let label;

	export let activeId;

 	export let description = undefined;

	export let fullWidth;

	export let background;

	$: bgColor = chroma($colorStore).alpha(0.05).css();
	$: activeColor = chroma($colorStore).css();

	const classes = {
		notActive: `border-b border-base-100 text-base-content-muted hover:text-base-content hover:border-base-300`,
		active: `border-b-2 border-[--activeColor] -mb-px text-[--activeColor] ${background ? 'bg-[--bgColor]' : ''}`
	};
</script>

<button
	style:--bgColor={bgColor}
	style:--activeColor={activeColor}
	on:click
	class="px-3 mt-2 py-2 text-center rounded-t text-sm font-medium font-sans whitespace-nowrap
	{activeId === id ? `transition ease-in ${classes.active}` : classes.notActive}
	{fullWidth ? 'flex-1' : ''}"
>
	{label}
	{#if description}
		<Info {description} />
	{/if}
</button>
