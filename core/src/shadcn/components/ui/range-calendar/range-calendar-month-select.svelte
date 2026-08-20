<script lang="ts">
	import { RangeCalendar as RangeCalendarPrimitive } from 'bits-ui';
	import { cn, type WithoutChildrenOrChild } from '../../../../shadcn/utils.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	let {
		ref = $bindable(null),
		class: className,
		value,
		onchange,
		...restProps
	}: WithoutChildrenOrChild<RangeCalendarPrimitive.MonthSelectProps> = $props();
</script>

<span
	class={cn(
		'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 relative flex cursor-pointer rounded-md transition-colors',
		className
	)}
>
	<RangeCalendarPrimitive.MonthSelect
		bind:ref
		class="absolute inset-0 cursor-pointer opacity-0"
		{...restProps}
	>
		{#snippet child({ props, monthItems, selectedMonthItem })}
			<select {...props} {value} {onchange}>
				{#each monthItems as monthItem (monthItem.value)}
					<option
						value={monthItem.value}
						selected={value !== undefined
							? monthItem.value === value
							: monthItem.value === selectedMonthItem.value}
					>
						{monthItem.label}
					</option>
				{/each}
			</select>
			<span
				class="[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md px-2 text-sm font-medium select-none [&>svg]:size-3.5"
				aria-hidden="true"
			>
				{monthItems.find((item) => item.value === value)?.label || selectedMonthItem.label}
				<ChevronDownIcon class="size-4" />
			</span>
		{/snippet}
	</RangeCalendarPrimitive.MonthSelect>
</span>
