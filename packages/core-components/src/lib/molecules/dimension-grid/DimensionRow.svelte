<script>
	import { cn } from '$lib/utils';
	export let row;
	export let value;
	export let selectedValue;
</script>

<div class="flex-1 relative truncate flex gap-8 justify-between py-0.5">
	<!-- Bar -->
	<div
		class={cn('bg-blue-50 group-hover:bg-blue-200 absolute inset-y-0 left-0 z-[-10]', {
			'bg-blue-200': selectedValue === row.dimensionValue
		})}
		style={'width:' + row.percentOfTop * 100 + '%'}
	/>

	<span class="truncate text-gray-900">
		{row.dimensionValue}
	</span>
	<span class="tabular-nums">{value}</span>
</div>
