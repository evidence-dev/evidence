<script>
	import { cn } from '$lib/utils';
	export let row;
	export let formattedValue;
	/** @type {string | string[] | undefined}*/
	export let selectedValue;

	$: isSelected = Array.isArray(selectedValue)
		? selectedValue.includes(row.dimensionValue)
		: selectedValue === row.dimensionValue;
</script>

<div class={cn('flex-1 relative truncate flex gap-8 justify-between py-0.5 text-xs ')}>
	<!-- Bar -->
	<div
		class={cn(
			'group-hover:bg-primary/30 dark:group-hover:bg-primary/40 bg-base-100 absolute inset-y-0 left-0 z-[-10] transition-colors w-full',
			{
				'bg-base-200': isSelected
			}
		)}
	/>
	<div
		class={cn(
			'bg-primary/20 dark:bg-primary/30 group-hover:bg-primary/30 dark:group-hover:bg-primary/40 absolute inset-y-0 left-0 z-[-10]',
			{
				// undefined occurs in multi-selects where the user has selected mutually exclusive options (see null row column combination story)
				'bg-base-300': row.metric === undefined
			},
			{
				// null can occur naturally, allow selection state to show through
				'bg-transparent': row.metric === null
			},
			{
				'bg-primary/50 dark:bg-primary/60 text-primary-content': row.metric && isSelected
			}
		)}
		style={row.metric
			? 'width:' +
				row.percentOfTop * 100 +
				'%;' +
				'transition: width 300ms 300ms, background-color 200ms 0ms; '
			: 'width: 100%;'}
	/>

	<span
		class={cn(
			'truncate transition-colors',
			{
				'font-medium': isSelected
			},
			{
				'text-base-content-muted': row.dimensionValue === null
			}
		)}
	>
		{row.dimensionValue ?? 'Missing'}
	</span>
	<span class="tabular-nums">
		{#if row.metric}
			{formattedValue}
		{:else}
			-&nbsp;
		{/if}
	</span>
</div>
