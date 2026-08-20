<script lang="ts">
	type Props = {
		rowCount?: number;
		rowLines?: boolean;
		rowShading?: boolean;
		hasLink?: boolean;
	};

	const { rowCount = 10, rowLines = true, rowShading = false, hasLink = false }: Props = $props();
</script>

<thead>
	<tr class="border-foreground/40 dark:border-foreground/40 border-b">
		<th
			class="text-foreground bg-background sticky top-0 py-1 pr-3 pl-1.5 text-left font-medium whitespace-nowrap"
		>
			<span class="bg-muted/60 inline-flex w-24 animate-pulse items-end rounded text-transparent"
				>&nbsp;</span
			>
		</th>
		<th
			class="text-foreground bg-background sticky top-0 px-3 py-1 text-left font-medium whitespace-nowrap"
		>
			<span class="bg-muted/60 inline-flex w-28 animate-pulse items-end rounded text-transparent"
				>&nbsp;</span
			>
		</th>
		<th
			class="text-foreground bg-background sticky top-0 py-1 pr-1.5 pl-3 text-left font-medium whitespace-nowrap"
		>
			<span class="bg-muted/60 inline-flex w-20 animate-pulse items-end rounded text-transparent"
				>&nbsp;</span
			>
		</th>
		{#if hasLink}
			<th
				class="text-foreground bg-background sticky top-0 w-8 py-1 pr-1.5 pl-2 text-center font-medium whitespace-nowrap"
			></th>
		{/if}
	</tr>
</thead>

<tbody>
	{#each Array.from({ length: rowCount }) as _}
		<tr
			class="{rowLines ? 'border-border border-b' : 'border-0'} {rowShading ? 'even:bg-muted' : ''}"
		>
			<td class="py-1 pr-3 pl-1.5 align-middle whitespace-nowrap">
				<span
					class="bg-muted inline animate-pulse rounded px-10 align-middle text-transparent"
					>&nbsp;</span
				>
			</td>
			<td class="px-3 py-1 align-middle whitespace-nowrap">
				<span
					class="bg-muted inline animate-pulse rounded px-12 align-middle text-transparent"
					>&nbsp;</span
				>
			</td>
			<td class="py-1 pr-1.5 pl-3 align-middle whitespace-nowrap">
				<span
					class="bg-muted inline animate-pulse rounded px-8 align-middle text-transparent"
					>&nbsp;</span
				>
			</td>
			{#if hasLink}
				<td class="w-8 py-1 pr-1.5 pl-2 text-center align-middle whitespace-nowrap"></td>
			{/if}
		</tr>
	{/each}
</tbody>
