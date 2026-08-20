<script lang="ts">
	import Search from 'lucide-svelte/icons/search';
	import X from 'lucide-svelte/icons/x';

	type Props = {
		searchTerm: string;
		onSearchChange: (value: string) => void;
		onClear: () => void;
		placeholder?: string;
	};

	const { searchTerm, onSearchChange, onClear, placeholder = 'Search table...' }: Props = $props();
</script>

<div class="mb-1.5 flex justify-start">
	<div class="relative w-80">
		<Search class="text-muted-foreground absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2" />
		<input
			type="text"
			{placeholder}
			value={searchTerm}
			oninput={(e) => onSearchChange(e.currentTarget.value)}
			class="border-input bg-background ring-offset-background placeholder:text-muted-foreground flex h-7 w-full rounded-md border px-2.5 py-1 pr-7 pl-7 text-xs outline-none file:border-0 file:bg-transparent file:text-xs file:font-medium disabled:cursor-not-allowed disabled:opacity-50"
		/>
		{#if searchTerm}
			<button
				onclick={onClear}
				class="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-1/2 right-1.5 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full transition-colors"
				title="Clear search"
			>
				<X class="h-3 w-3" />
			</button>
		{/if}
	</div>
</div>
