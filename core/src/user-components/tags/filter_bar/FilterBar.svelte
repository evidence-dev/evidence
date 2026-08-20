<script lang="ts">
	import { cn } from '../../../shadcn/utils';
	import { useIntersection } from '../../../useIntersection.svelte';
	import type { UserComponentProps } from '../../types';
	import type { schema } from './schema';

	const props: UserComponentProps<typeof schema> = $props();
	const children = $derived(props.children);

	const { intersectionAction, intersectionState } = useIntersection({ default: true });
	const floating = $derived(!intersectionState.isIntersecting);
</script>

<!-- Element to detect scroll intersection -->
<!-- The margins here should match the padding on the scroll area -->
<div use:intersectionAction aria-hidden="true" class="pointer-events-none -mt-4 mb-4 h-0 w-0"></div>

<div
	class={cn(
		'sticky top-4 right-0 left-0 z-50 flex flex-row flex-wrap items-end gap-4 rounded-md border pt-3 pb-2 transition-all',
		floating ? 'bg-background border-border px-4 shadow' : 'border-transparent shadow-none'
	)}
>
	{@render children?.()}
</div>
