<script lang="ts">
	import { RangeCalendar as RangeCalendarPrimitive } from 'bits-ui';
	import { cn, type WithoutChildrenOrChild } from '../../../../shadcn/utils.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	let {
		ref = $bindable(null),
		class: className,
		value,
		...restProps
	}: WithoutChildrenOrChild<RangeCalendarPrimitive.YearSelectProps> = $props();
</script>

<span
	class={cn(
		'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 relative flex cursor-pointer rounded-md transition-colors',
		className
	)}
>
	<RangeCalendarPrimitive.YearSelect
		bind:ref
		class="absolute inset-0 cursor-pointer opacity-0"
		{...restProps}
	>
		{#snippet child({ props, yearItems, selectedYearItem })}
			<select {...props} {value}>
				{#each yearItems as yearItem (yearItem.value)}
					<option
						value={yearItem.value}
						selected={value !== undefined
							? yearItem.value === value
							: yearItem.value === selectedYearItem.value}
					>
						{yearItem.label}
					</option>
				{/each}
			</select>
			<span
				class="[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md px-2 text-sm font-medium select-none [&>svg]:size-3.5"
				aria-hidden="true"
			>
				{yearItems.find((item) => item.value === value)?.label || selectedYearItem.label}
				<ChevronDownIcon class="size-4" />
			</span>
		{/snippet}
	</RangeCalendarPrimitive.YearSelect>
</span>
