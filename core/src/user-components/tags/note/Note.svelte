<script lang="ts">
	import { cn } from '../../../shadcn/utils';
	import type { UserComponentProps } from '../../types';
	import type { schema } from './schema';

	let props: UserComponentProps<typeof schema> = $props();

	const className = $derived(props.class);
	const children = $derived(props.children);
</script>

<div
	class={cn(
		'prose dark:prose-invert text-muted-foreground mt-0 block pb-3 text-xs leading-normal',
		className
	)}
>
	<span>
		{@render children?.()}
	</span>
</div>
