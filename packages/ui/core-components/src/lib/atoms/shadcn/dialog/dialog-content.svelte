<script>
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import * as Dialog from '.';
	import { cn, flyAndScale } from '$lib/utils';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Cross2 } from '@steeze-ui/radix-icons';

	/** @type {string | undefined | null} */
	let className = undefined;

	/** @type {any} */
	export let transition = flyAndScale;

	/** @type {Object} */
	export let transitionConfig = {
		duration: 200
	};

	export { className as class };
</script>

<Dialog.Portal>
	<Dialog.Overlay />
	<DialogPrimitive.Content
		{transition}
		{transitionConfig}
		class={cn(
			'z-50 grid gap-4 border bg-base-100 p-6 shadow-lg sm:inset-14 sm:rounded-lg ',
			className
		)}
		{...$$restProps}
	>
		<slot />
		<DialogPrimitive.Close
			class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-base-100 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-base-content-muted focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-base-200 data-[state=open]:text-base-content-muted"
		>
			<Icon src={Cross2} class="h-4 w-4" />
			<span class="sr-only">Close</span>
		</DialogPrimitive.Close>
	</DialogPrimitive.Content>
</Dialog.Portal>
