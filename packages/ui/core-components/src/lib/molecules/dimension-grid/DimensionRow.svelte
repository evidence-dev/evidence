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
			'group-hover:bg-blue-100 bg-white absolute inset-y-0 left-0 z-[-10] transition-colors duration-200 w-full',
			{
				'bg-gray-100': isSelected
			}
		)}
	/>
	<div
		class={cn(
			'bg-blue-50 group-hover:bg-blue-100 absolute inset-y-0 left-0 z-[-10]',
			value.includes('NaN') ? 'bg-gray-200' : isSelected ? 'bg-blue-200' : ''
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
			'truncate text-gray-900 transition-colors duration-200',
			{
				'font-medium': isSelected
			},
			{
				'text-gray-800': row.dimensionValue === null
			}
		)}
	>
		{row.dimensionValue ?? 'Missing'}
	</span>
	<span class="tabular-nums">{@html Number.isNaN(parseInt(value)) ? '-&nbsp;' : value}</span>
</div>
