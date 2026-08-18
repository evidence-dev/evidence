<script lang="ts">
	import Download from 'lucide-svelte/icons/download';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import { buttonVariants } from '../../../shadcn/components/ui/button';
	import * as Tooltip from '../../../shadcn/components/ui/tooltip';
	import { cn } from '../../../shadcn/utils';

	type Props = {
		onclick: () => void;
		loading?: boolean;
	};

	const { onclick, loading = false }: Props = $props();
</script>

<Tooltip.Provider>
	<Tooltip.Root ignoreNonKeyboardFocus>
		<Tooltip.Trigger
			class={cn(
				buttonVariants({ variant: 'ghost', size: 'icon', class: 'text-muted-foreground size-6' })
			)}
			{onclick}
			disabled={loading}
			aria-label="Download data"
		>
			{#if loading}
				<LoaderCircle class="h-3.5 w-3.5 animate-spin [animation-duration:1s]" />
			{:else}
				<Download class="h-3.5 w-3.5" />
			{/if}
		</Tooltip.Trigger>
		<Tooltip.Content class="evidence-page-theme px-2 py-1">Download</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
