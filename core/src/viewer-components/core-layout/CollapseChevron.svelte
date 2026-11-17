<script lang="ts">
	import { ChevronRight } from 'lucide-svelte';
	import { cn } from '../../shadcn/utils';

	let { expanded, class: className }: { expanded: boolean; class?: string } = $props();
</script>

<ChevronRight
	class={cn(
		'text-muted-foreground ml-auto size-3.5 shrink-0 opacity-50 transition-[transform,opacity] duration-200 group-hover:opacity-90',
		expanded && 'rotate-90',
		className
	)}
	strokeWidth={1.75}
/>
