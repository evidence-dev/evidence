<script>
	import { cn } from '$lib/utils';
	export let row;
	export let value;
	export let selectedValue;
	export let multipleSelectedValues

	let containsSelectedValue

	$: if (multipleSelectedValues.length > 0) {
		containsSelectedValue = multipleSelectedValues.includes(row.dimensionValue)
	} else {
		containsSelectedValue = selectedValue === row.dimensionValue
	}

</script>

<div class={cn('flex-1 relative truncate flex gap-8 justify-between py-0.5 text-xs')}>
	<!-- Bar -->
	<div
		class={cn(
			'group-hover:bg-blue-100 absolute inset-y-0 left-0 z-[-10] transition duration-100 w-full',
			{
				'bg-gray-100': containsSelectedValue
			}
		)}
	/>
	<div
		class={cn(
			'bg-blue-50 group-hover:bg-blue-200 absolute inset-y-0 left-0 z-[-10] transition duration-100',
			{
				'bg-blue-200': containsSelectedValue
			}
		)}
		style={'width:' + row.percentOfTop * 100 + '%'}
	/>

	<span
		class={cn(
			'truncate text-gray-900 transition duration-100',
			{
				'font-medium': containsSelectedValue
			},
			{
				'text-gray-800': row.dimensionValue === null
			}
		)}
	>
		{row.dimensionValue ?? 'Missing'}
	</span>
	<span class="tabular-nums">{value}</span>
</div>
