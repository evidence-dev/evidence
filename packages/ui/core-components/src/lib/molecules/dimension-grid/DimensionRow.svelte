<script>
	import { cn } from '$lib/utils';
	export let row;
	export let value;
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
			'group-hover:bg-primary/20 dark:group-hover:bg-primary/30 bg-base-100 absolute inset-y-0 left-0 z-[-10] transition-colors w-full',
			{
				'bg-base-200': isSelected
			}
		)}
	/>
	<div
		class={cn(
			'bg-primary/10 dark:bg-primary/20 group-hover:bg-transparent absolute inset-y-0 left-0 z-[-10]',
			value.includes('NaN') ? 'bg-base-300' : isSelected ? 'bg-primary/30 dark:bg-primary/40' : ''
		)}
		style={value.includes('NaN')
			? 'width: 100%;'
			: 'width:' +
				row.percentOfTop * 100 +
				'%;' +
				'transition: width 300ms 300ms, background-color 200ms 0ms; '}
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
	<span class="tabular-nums">{@html Number.isNaN(parseInt(value)) ? '-&nbsp;' : value}</span>
</div>
