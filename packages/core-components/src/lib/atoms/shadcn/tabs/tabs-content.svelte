<script>
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	/** @type {string | undefined | null} */
	let className = undefined;
	/** @type {any} */
	export let value;

	export { className as class };
</script>

<TabsPrimitive.Content
	class={cn('mt-2 ring-offset-white focus-visible:outline-none ', className)}
	{value}
	{...$$restProps}
>
	<slot />
</TabsPrimitive.Content>
