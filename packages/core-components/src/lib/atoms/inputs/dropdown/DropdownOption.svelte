<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { isInvisible } from './Invisible.svelte';
	const invisible = isInvisible();

	import { getContext } from 'svelte';
	import * as Command from '$lib/atoms/shadcn/command';
	import { Check } from 'radix-icons-svelte';
	import { cn } from '$lib/utils.js';

	export let value;
	export let valueLabel = value;

	const ctx = getContext('dropdown_context');

	// The first DropdownOption is the selected by default, but defaultValue overrides it
	if (!ctx.hasBeenSet || value === ctx.defaultValue) {
		ctx.handleSelect({ value, label: valueLabel });
		ctx.hasBeenSet = true;
	}

	const selectedValues = getContext('dropdown_selected_values');
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
				<Check className={cn('h-4 w-4')} />
			</div>
		{:else}
			<Check
				class={cn(
					'mr-2 h-4 w-4',
					!$selectedValues.find((x) => x.value === value && x.label === valueLabel) &&
						'text-transparent'
				)}
			/>
		{/if}
		<span>
			{valueLabel}
		</span>
	</Command.Item>
{/if}
