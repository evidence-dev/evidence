<script>
	import { init, graphic } from 'echarts';
	import { ToggleGroup } from 'bits-ui';
	import { blur, fly, fade } from 'svelte/transition';

	export let data;
	export let selectedMetric = undefined;
	export let declining = false;

	let chart;
	let currentValue = 4.28; // Default value

	const makeChart = (node) => {
		chart = init(node, null, { renderer: 'svg' });
		updateChartOptions();

		chart.on('globalout', function () {
			console.log('mouseout');
			currentValue = '4.28';
		});

		window.addEventListener('resize', function () {
			chart.resize();
		});

		return {
			destroy() {
				chart.dispose();
			}
		};
	};

	function updateChartOptions() {
		if (!chart) return;

		chart.setOption({
			animation: false,
			dataset: {
				source: data
			},
			xAxis: {
				type: 'time',
				show: false
			},
			yAxis: {
				type: 'value',
				show: false
			},
			tooltip: {
				trigger: 'axis',
				showContent: false,
				axisPointer: {
					type: 'line',
					z: 0,
					lineStyle: {
						color: '#e5e7eb',
						width: 1,
						opacity: 0.75,
						type: 'solid'
					},
					label: {
						formatter: function (params) {
							if (params.seriesData && params.seriesData.length > 0) {
								const value = params.seriesData[0].value[selectedMetric];
								currentValue = Number(value.toFixed(2));
							} 
							return '';
						}
					}
				}
			},
			series: [
				{
					name: 'value',
					encode: {
						x: 'date',
						y: selectedMetric
					},
					type: 'line',
					silent: false, // Changed to false to enable hover events
					showSymbol: false,
					symbol: 'circle',
					symbolSize: 1,
					smooth: true,
					lineStyle: {
						color: '#16a34a',
						width: 1.25,
						opacity: 1
					},
					itemStyle: {
						color: '#16a34a',
						opacity: 1
					},
					areaStyle: {
						color: new graphic.LinearGradient(0, 0, 0, 1, [
							{
								offset: 0,
								color: '#22c55e'
							},
							{
								offset: 0.75,
								color: '#f9fafb'
							}
						]),
						opacity: 0.1
					}
				}
			],
			width: '100%',
			height: '100%',
			grid: {
				top: 0,
				left: 0,
				right: 0,
				bottom: 0
			}
		});
	}

	$: if (chart && selectedMetric) {
		updateChartOptions();
	}

	let selectedTimeRange = '1Y';
</script>

<div class="p-2 relative">
	<div
		class="absolute top-2 left-2 z-10 bg-gradient-to-br from-gray-50/90 via-gray-50/60 to-gray-50/30 rounded pr-3"
	>
		<span class="block font-bold text-gray-800">ARR</span>
		{#key currentValue}
			<span class="block text-sm font-light text-gray-800 rounded">${currentValue}M</span>
		{/key}
	</div>
	<div class="flex flex-col justify-between">
		{#key selectedMetric}
			<div
				class="min-h-32 flex-grow rounded-lg overflow-clip relative"
				use:makeChart
				in:fade|local
			>
				<div
					class="print:hidden absolute inset-0 h-full w-full bg-gray-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"
				/>
			</div>
		{/key}
		<div>
			<ToggleGroup.Root
				class="flex gap-1 text-xs text-gray-600 font-light justify-end z-20"
				type="single"
				bind:value={selectedTimeRange}
			>
				{#each ['1W', '1M', '3M', '1Y', 'YTD', 'All'] as timeRange (timeRange)}
					<ToggleGroup.Item
						value={timeRange}
						class="hover:bg-gray-100 py-0.5 px-3 rounded cursor-pointer data-[state=on]:bg-gray-100 data-[state=on]:shadow-inner  data-[state=on]:text-gray-900 text-gray-400 font-medium transition-all duration-200"
					>
						{timeRange}
					</ToggleGroup.Item>
				{/each}
			</ToggleGroup.Root>
		</div>
	</div>
</div>
