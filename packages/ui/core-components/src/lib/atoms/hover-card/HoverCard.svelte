<script>
	import * as HoverCard from '$lib/atoms/shadcn/hover-card/index.js';

	export let align = 'center';
	export let side = 'bottom';
	export let alignOffset = 0;
	export let sideOffset = 4;
	export let openDelay = 0;
	export let closeDelay = 0;

</script>

<!-- class="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-black" -->

<HoverCard.Root {openDelay} {closeDelay} >
	<HoverCard.Trigger>
		<slot name="trigger" />
	</HoverCard.Trigger>
	<HoverCard.Content  {align} {side} {alignOffset} {sideOffset}>
		<slot name="content" />
	</HoverCard.Content>
</HoverCard.Root>
