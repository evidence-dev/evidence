<script>
    import TimeSeriesPanelChart from "./TimeSeriesPanelChart.svelte";
	export let data;
</script>

<div class="rounded-xl p-2 grid grid-rows-2 sm:grid-cols-2 sm:grid-rows-1 gap-4 bg-gradient-to-tr from-gray-50 to-gray-50 mb-4">
	<div class="">
		{#each ['ARR', 'WAU', 'Cloud WAU', 'Week 4 Retention', 'GH Stars'] as metric}
			<div
				class="flex justify-between text-xs rounded-sm py-2 px-2 border-b border-dashed hover:text-gray-950 text-gray-700 last:border-none cursor-pointer"
			>
				<div class="whitespace-nowrap truncate">{metric}</div>
				<div class="flex gap-3 tabular-nums">
					<span class="">{Math.floor(Math.random()*5000).toLocaleString()}</span>
					<span class="text-green-600">+{Math.floor(Math.random()*11).toLocaleString()}</span>
					<span class="px-3 bg-green-200/40 rounded-sm text-green-700">+{Math.floor(Math.random()*10).toLocaleString()}%</span>
				</div>
			</div>
		{/each}
	</div>
	<div class="px-2 relative">
        <div class="absolute top-0 left-2 z-10 ">
            <div class="text-lg font-bold text-gray-800">ARR</div>
            <span class="text-sm font-light text-gray-700 rounded">$4.28M</span>
        </div>
        <TimeSeriesPanelChart {data} />
	</div>
</div>
