<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { isInvisible } from './Invisible.svelte';
	const invisible = isInvisible();

	import { getContext } from 'svelte';
	import * as Command from '$lib/atoms/shadcn/command';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Check } from '@steeze-ui/radix-icons';
	import { cn } from '$lib/utils.js';

	export let value;
	export let valueLabel = value;

	const ctx = getContext('dropdown_context');
	const selectedValues = getContext('dropdown_selected_values');

	$: if (invisible) {
		if (!ctx.hasBeenSet) {
			ctx.hasBeenSet = true;
			console.log({ value, valueLabel });
			ctx.handleSelect({ value, label: valueLabel });
		}
	}
</script>

{#if !invisible}
	<Command.Item
		value={String(valueLabel)}
		onSelect={() => ctx.handleSelect({ value, label: valueLabel })}
	>
		{#if ctx.multiple}
			<div
				class={cn(
					'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-gray-900',
					$selectedValues.find((x) => x.value === value && x.label === valueLabel)
						? 'bg-gray-900 text-gray-50'
						: 'opacity-50 [&_svg]:invisible'
				)}
			>
				<Icon src={Check} class={cn('h-4 w-4')} />
			</div>
		{:else}
			<div class="mr-2 flex h-4 w-4 items-center justify-center">
				<Icon
					src={Check}
					class={cn(
						'h-4 w-4',
						!$selectedValues.find((x) => x.value === value && x.label === valueLabel) &&
							'text-transparent'
					)}
				/>
			</div>
		{/if}
		<span class=" line-clamp-4">
			{valueLabel}
		</span>
	</Command.Item>
{/if}
