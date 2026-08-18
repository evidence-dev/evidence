<script lang="ts">
	import type { UserComponentAttribute } from './types';

	let {
		name,
		attr,
		searchQuery
	}: {
		name: string;
		attr: UserComponentAttribute;
		searchQuery: string;
	} = $props();

	function highlightText(text: string, query: string) {
		if (!query) return text;
		const regex = new RegExp(`(${query})`, 'gi');
		return text.replace(regex, '<span class="bg-yellow-200 dark:bg-yellow-900">$1</span>');
	}
</script>

<div class="bg-card rounded-md border p-3">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<span class="font-mono text-sm">
				{@html highlightText(name, searchQuery)}
			</span>
			{#if attr.required}
				<span class="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs">required</span>
			{/if}
		</div>
		{#if attr.type}
			{@const type = Array.isArray(attr.type)
				? attr.type.map((t) => t.name).join(', ')
				: attr.type.name}
			<span class="text-muted-foreground text-xs">
				{@html highlightText(type, searchQuery)}
			</span>
		{/if}
	</div>
	{#if attr.description}
		<p class="text-muted-foreground mt-1 text-sm">
			{@html highlightText(attr.description, searchQuery)}
		</p>
	{/if}
	{#if attr.default !== undefined}
		<p class="text-muted-foreground mt-1 text-xs">
			Default: <span class="font-mono"
				>{@html highlightText(attr.default.toString(), searchQuery)}</span
			>
		</p>
	{/if}
	{#if Array.isArray(attr.matches)}
		<p class="text-muted-foreground mt-1 text-xs">
			Matches: <span class="font-mono"
				>{@html highlightText(attr.matches.join(', '), searchQuery)}</span
			>
		</p>
	{/if}
</div>
