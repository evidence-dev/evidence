<script>
	import { init, graphic } from 'echarts';
	import { RadioGroup } from 'bits-ui';
	import { blur, fly, fade } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';

	export let data;
	export let selectedMetric = undefined;
	export let declining = false;

	let chart;
	let currentValue = 4.28; // Default value

	const makeChart = (node) => {
		chart = init(node, null, { renderer: 'svg' });
		updateChartOptions();

		chart.on('globalout', function () {
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

	const [send, receive] = crossfade({
		duration: 200,
		easing: cubicInOut
	});
</script>

<div class="grid grid-rows-6 gap-y-1">
	<div class="row-span-2">
		<div class="font-bold text-gray-700">ARR</div>
		<div class="text-sm font-light text-gray-800">${currentValue}M</div>
	</div>
	<div class="row-span-3">
		{#key selectedMetric}
			<div class="h-full rounded-lg overflow-clip relative" use:makeChart in:fade|local>
				<div
					class="print:hidden absolute inset-0 h-full w-full bg-gray-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"
				/>
			</div>
		{/key}
	</div>
	<div class="row-span-1">
		<RadioGroup.Root
			class="flex gap-1 text-xs text-gray-600 font-light justify-end"
			type="single"
			bind:value={selectedTimeRange}
			orientation="horizontal"
		>
			{#each ['1W', '1M', '3M', '1Y', 'YTD', 'All'] as timeRange (timeRange)}
				<RadioGroup.Item
					value={timeRange}
					class="hover:bg-gray-100 py-1 px-3 rounded cursor-pointer  data-[state=checked]:text-gray-700 text-gray-400 font-medium transition-all relative "
				>
					{timeRange}

					{#if selectedTimeRange === timeRange}
						<div
							in:send={{ key: 'trigger' }}
							out:receive={{ key: 'trigger' }}
							class="absolute bottom-0 left-1/2 h-1 rounded-full w-1 -translate-x-1/2 bg-gray-900"
						/>
					{/if}
				</RadioGroup.Item>
			{/each}
		</RadioGroup.Root>
	</div>
</div>
