<script lang="ts">
	import { Command as CommandPrimitive } from 'cmdk-sv';
	import { cn } from '$lib/utils';
	type $$Props = CommandPrimitive.GroupProps;

	let className: string | undefined | null = undefined;
	export { className as class };
</script>

<CommandPrimitive.Group
	class={cn(
		'text-foreground overflow-hidden p-1 [&_[data-cmdk-group-heading]]:px-2 [&_[data-cmdk-group-heading]]:py-1.5 [&_[data-cmdk-group-heading]]:text-xs [&_[data-cmdk-group-heading]]:font-medium [&_[data-cmdk-group-heading]]:text-gray-500',
		className
	)}
	{...$$restProps}
>
	<slot />
</CommandPrimitive.Group>
