<script>
	import {
		HoverCard,
		HoverCardContent,
		HoverCardTrigger
	} from '$lib/atoms/shadcn/hover-card/index.js';

	export let align = 'center';
	export let side = 'bottom';
	export let alignOffset = 0;
	export let sideOffset = 4;
	export let openDelay = 0;
	export let closeDelay = 0;
</script>

<HoverCard {openDelay} {closeDelay}>
	<HoverCardTrigger>
		<slot name="trigger" />
	</HoverCardTrigger>
	<HoverCardContent {align} {side} {alignOffset} {sideOffset}>
		<slot name="content" />
	</HoverCardContent>
</HoverCard>
