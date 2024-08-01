<script>
	import * as HoverCard from '$lib/atoms/shadcn/hover-card/index.js';
</script>

<!-- class="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-black" -->

<HoverCard.Root openDelay="0" closeDelay="0">
	<HoverCard.Trigger>
		<slot name="trigger" />
	</HoverCard.Trigger>
	<HoverCard.Content>
		<slot name="content" />
	</HoverCard.Content>
</HoverCard.Root>
