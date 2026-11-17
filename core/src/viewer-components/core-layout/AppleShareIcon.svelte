<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';
	import { cn } from '../../shadcn/utils';

	let { class: className, ...restProps }: SVGAttributes<SVGSVGElement> = $props();
</script>

<svg
	{...restProps}
	class={cn('size-4', className)}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.75"
	stroke-linecap="round"
	stroke-linejoin="round"
	shape-rendering="geometricPrecision"
	aria-hidden="true"
>
	<path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
</svg>
