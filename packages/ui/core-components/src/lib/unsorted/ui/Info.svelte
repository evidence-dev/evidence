<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { Icon } from '@steeze-ui/svelte-icon';
	import { InfoCircled } from '@steeze-ui/radix-icons';
	import { getThemeStores } from '../../themes/themes.js';
	import chroma from 'chroma-js';
	import HoverCard from '../../atoms/hover-card/HoverCard.svelte';

	/** @type {import('@steeze-ui/svelte-icon').IconSource} */
	let icon = InfoCircled;

	export let description = '';

	export let size = 4;

	export let className = undefined;

	const { resolveColor } = getThemeStores();
	export let color = 'base-content-muted';
	$: colorStore = resolveColor(color);
	$: textColor = chroma($colorStore).css();
</script>

<HoverCard align="start" side="right" alignOffset={-8} sideOffset={4}>
	<span
		slot="trigger"
		style:--textColor={textColor}
		class="inline-block align-middle pb-0.5 pr-1 leading-4 w-fit {className}"
		role="tooltip"
	>
		<slot name="handle">
			<Icon src={icon} class="w-{size} h-{size} text-[--textColor]" />
		</slot>
	</span>
	<div slot="content" class="bg-base-100 p-2 rounded-md text-base-content text-xs max-w-52">
		<p class="leading-relaxed text-pretty">
			{description}
		</p>
	</div>
</HoverCard>
