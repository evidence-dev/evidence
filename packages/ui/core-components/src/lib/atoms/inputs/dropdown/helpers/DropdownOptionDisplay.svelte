<script>
	/*
        This component is for INTERNAL USE ONLY

        It is responsible for the Display Logic for a Dropdown Option, not the actual
        registration of an option.

        It is completely unaware of the dropdown at large
    */

	import * as Command from '$lib/atoms/shadcn/command';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Check } from '@steeze-ui/radix-icons';
	import { cn } from '$lib/utils.js';

	/** @type {any} */
	export let value;
	/** @type {string} */
	export let valueLabel = value;
	/** @type {boolean} */
	export let active = false;

	/**
	 * @type {({ value: any, label: string }) => void}
	 */
	export let handleSelect;
	/**
	 * @type {boolean}
	 */
	export let multiple;
</script>

<Command.Item
	value={String(valueLabel)}
	onSelect={() => handleSelect({ value, label: valueLabel })}
>
	{#if multiple}
		<div
			class={cn(
				'mr-2 flex h-4 w-4 items-center justify-center rounded-xs border border-base-content',
				active ? 'bg-base-content text-base-100' : 'opacity-50 [&_svg]:invisible'
			)}
		>
			<Icon src={Check} class={cn('h-4 w-4')} />
		</div>
	{:else}
		<div class="mr-2 flex h-4 w-4 items-center justify-center">
			<Icon src={Check} class={cn('h-4 w-4', !active ? 'text-transparent' : '')} />
		</div>
	{/if}
	<span class=" line-clamp-4">
		{valueLabel}
	</span>
</Command.Item>
