<script lang="ts">
	import * as Select from '../../../shadcn/components/ui/select';
	import { Label } from '../../../shadcn/components/ui/label';
	import { loadLucideIcon } from '../../common/dynamic-icon';
	import type { Component } from 'svelte';
	import { browser } from '../../../shims/env';
	import type { AvailableIconName } from '../../common/icon-names';
	import Info from '../info/Info.svelte';
	import formatTitle from '../../formatTitle';

	type Props = {
		id: string;
		items: string[];
		selected?: string;
		onValueChange?: (value: string | undefined) => void;
		title?: string;
		info?: string;
		info_link?: string;
		info_link_title?: string;
		placeholder?: string;
		icon?: AvailableIconName;
		labelFormatter?: (value: string) => string;
	};

	let {
		id,
		items,
		selected = $bindable(),
		onValueChange,
		title,
		info,
		info_link,
		info_link_title,
		placeholder,
		icon,
		labelFormatter
	}: Props = $props();

	let IconComponent = $state<Component | null>(null);

	// Load icon when icon prop changes
	$effect(() => {
		if (icon && browser) {
			IconComponent = loadLucideIcon(icon);
		} else {
			IconComponent = null;
		}
	});

	const formattedPlaceholder = $derived(placeholder ?? `Select ${id}`);

	// Format the selected value for display
	const formattedSelected = $derived(
		selected ? (labelFormatter ? labelFormatter(selected) : formatTitle(selected)) : ''
	);

	// Helper to format item labels
	const getItemLabel = (item: string) => {
		return labelFormatter ? labelFormatter(item) : formatTitle(item);
	};

	const handleValueChange = (value: string) => {
		if (value !== selected) {
			selected = value;
			onValueChange?.(value);
		}
	};
</script>

{#if title || info}
	<Label for={id} class="mb-2">
		{title ?? formatTitle(id)}
		{#if info}
			<Info text={info} link={info_link} link_title={info_link_title} className="-mb-0.5" />
		{/if}
	</Label>
{/if}

<div class="relative mb-4">
	<Select.Root type="single" value={selected} onValueChange={handleValueChange}>
		<Select.Trigger class="bg-input-surface hover:bg-accent/30 relative h-9 w-full" {id}>
			<div class="flex items-center gap-2">
				{#if IconComponent}
					<IconComponent class="text-muted-foreground mr-1 size-3.5 shrink-0" />
				{/if}
				<span
					class="flex-1 text-left"
					class:text-foreground={formattedSelected}
					class:text-muted-foreground={!formattedSelected}
				>
					{formattedSelected || formattedPlaceholder}
				</span>
			</div>
		</Select.Trigger>
		<Select.Content class="evidence-page-theme">
			{#each items as item (item)}
				<Select.Item value={item} label={getItemLabel(item)} class="cursor-pointer">
					{getItemLabel(item)}
				</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
</div>
