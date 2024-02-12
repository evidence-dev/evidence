<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';

	type $$Props = HTMLAttributes<HTMLSpanElement>;

	let className: string | undefined | null = undefined;
	export { className as class };
</script>

<span class={cn('ml-auto text-xs tracking-widest text-gray-500', className)} {...$$restProps}>
	<slot />
</span>
