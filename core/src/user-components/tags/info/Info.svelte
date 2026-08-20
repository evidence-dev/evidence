<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { InfoIcon } from 'lucide-svelte';
	import { cn } from '../../../shadcn/utils';
	import * as HoverCard from '../../../shadcn/components/ui/hover-card';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import { sanitizeUrl } from '../../common/transform-internal-link';

	const props: UserComponentProps<typeof schema> = $props();

	// Get filter contexts for variable processing
	const pageFilters = getPageFiltersContext();
	const repeatFilters = getRepeatContext()?.filters;
	const inlineQueries = getInlineQueriesContext();

	// === VARIABLE INTERPOLATION ===
	const variableProcessor = $derived.by(() => {
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0 || !inlineQueries) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});

	const { resolveText } = $derived(createResolvers(variableProcessor));

	const className = $derived(props.className);
	const text = $derived(resolveText(props.text));
	const color = $derived(resolveText(props.color));
	const link = $derived(sanitizeUrl(resolveText(props.link)));
	const link_title = $derived(resolveText(props.link_title));

	// State for manual toggle
	let isOpen = $state(false);

	function toggleOpen() {
		isOpen = !isOpen;
	}

	// Determine icon color classes based on color prop
	const iconColorClass = $derived(
		color ? '' : 'text-muted-foreground/80 hover:text-muted-foreground'
	);
</script>

<HoverCard.Root bind:open={isOpen} openDelay={100} closeDelay={100}>
	<HoverCard.Trigger>
		<span
			class={cn('inline-block w-fit cursor-pointer pb-0.5 align-middle leading-4', className)}
			role="button"
			aria-expanded={isOpen}
			aria-label="Toggle tooltip"
			tabindex="0"
			onclick={toggleOpen}
			onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleOpen()}
		>
			<InfoIcon
				class={cn('size-3.5 transition-colors', iconColorClass)}
				style={color ? `color: ${color}` : undefined}
			/>
		</span>
	</HoverCard.Trigger>
	<HoverCard.Content
		align="start"
		side="right"
		alignOffset={-8}
		sideOffset={4}
		class="bg-popover text-popover-foreground w-max max-w-sm min-w-0 rounded-md p-2 text-xs font-normal"
	>
		<p class="leading-relaxed text-pretty">
			{#if link}
				{#if link_title}
					{text}
					<a href={link} class="underline underline-offset-2">
						{link_title}
					</a>
				{:else}
					<a href={link} class="underline underline-offset-2">
						{text}
					</a>
				{/if}
			{:else}
				{text}
			{/if}
		</p>
	</HoverCard.Content>
</HoverCard.Root>
