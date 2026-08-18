<script lang="ts">
	import { cn, type WithElementRef } from '../../../../shadcn/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import { useSidebar } from './context.svelte.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement> = $props();

	const sidebar = useSidebar();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={ref}
	data-sidebar="rail"
	data-slot="sidebar-rail"
	class={cn(
		'absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex',
		'cursor-col-resize items-center justify-center',
		'hover:after:bg-sidebar-border after:absolute after:inset-y-0 after:left-1/2 after:w-[2px]',
		'group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full',
		'[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
		'[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
		sidebar.isResizing && 'after:bg-sidebar-border',
		className
	)}
	onpointerdown={sidebar.startResize}
	ondblclick={sidebar.toggle}
	{...restProps}
>
	{@render children?.()}
</div>
