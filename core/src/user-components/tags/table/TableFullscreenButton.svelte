<script lang="ts">
	import Maximize2 from 'lucide-svelte/icons/maximize-2';
	import Minimize2 from 'lucide-svelte/icons/minimize-2';
	import { buttonVariants } from '../../../shadcn/components/ui/button';
	import * as Tooltip from '../../../shadcn/components/ui/tooltip';
	import { cn } from '../../../shadcn/utils';

	type Props = {
		onclick: () => void;
		expanded?: boolean;
	};

	const { onclick, expanded = false }: Props = $props();
</script>

<Tooltip.Provider>
	<Tooltip.Root ignoreNonKeyboardFocus>
		<Tooltip.Trigger
			class={cn(
				buttonVariants({ variant: 'ghost', size: 'icon', class: 'text-muted-foreground size-6' })
			)}
			{onclick}
			aria-label={expanded ? 'Exit fullscreen' : 'Expand table'}
		>
			{#if expanded}
				<Minimize2 class="h-3.5 w-3.5" />
			{:else}
				<Maximize2 class="h-3.5 w-3.5" />
			{/if}
		</Tooltip.Trigger>
		<Tooltip.Content class="evidence-page-theme px-2 py-1">
			{expanded ? 'Exit fullscreen' : 'Fullscreen'}
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
