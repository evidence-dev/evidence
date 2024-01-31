<script>
	export let row;
</script>

<div class="flex-1 relative truncate flex gap-8 justify-between py-0.5">
	<!-- Bar -->
	<div
		class="bg-blue-50 group-hover:bg-blue-200 absolute inset-y-0 left-0 z-[-10]"
		style={'width:' + row.percentOfTop * 100 + '%'}
	/>

	<span class="truncate text-gray-900">
		{row.dimensionValue}
	</span>
	<span class="tabular-nums">{row.metric}</span>
</div>
