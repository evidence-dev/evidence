<script lang="ts">
	import { buttonVariants } from '../../../shadcn/components/ui/button';
	import * as Tooltip from '../../../shadcn/components/ui/tooltip';
	import { cn } from '../../../shadcn/utils';
	import { LoaderCircle } from 'lucide-svelte';
	import type { SvelteComponent } from 'svelte';

	type Props = {
		label: string;
		Icon: typeof SvelteComponent<{ class?: string }>;
		loading?: boolean;
		disabled?: boolean;
		onclick: () => void;
	};
	let { label, Icon, loading, disabled, onclick }: Props = $props();
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger
			class={cn(
				buttonVariants({ variant: 'ghost', size: 'icon', class: 'text-muted-foreground size-6' })
			)}
			{onclick}
			disabled={disabled || loading}
			aria-label={label}
		>
			{#if loading}
				<LoaderCircle class="h-3.5 w-3.5 animate-spin" />
			{:else}
				<Icon class="h-3.5 w-3.5" />
			{/if}
		</Tooltip.Trigger>
		<Tooltip.Content class="evidence-page-theme px-2 py-1">{label}</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
