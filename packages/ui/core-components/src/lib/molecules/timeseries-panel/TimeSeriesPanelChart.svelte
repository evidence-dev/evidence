<script>
	import { init, graphic } from 'echarts';
	import { RadioGroup } from 'bits-ui';
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';
	import { fmt as format } from '@evidence-dev/component-utilities/formatting';

	export let data;
	export let selectedMetric = undefined;
	export let declining = false;
	export let store;
	export let defaultTimeRange = undefined;
	export let metricsStore;

	$: activeFmt = metricsStore.find((metric) => metric.label === selectedMetric).fmt || 'num0';

	$: console.log(activeFmt);

	let chart;

	$: currentValue = data.length > 0 ? data[data.length - 1][selectedMetric] : null;

	$: if (currentValue > data[0][selectedMetric]) {
		declining = false;
	} else {
		declining = true;
	}

	const makeChart = (node) => {
		chart = init(node, null, { renderer: 'svg' });
		updateChartOptions();

		chart.on('globalout', function () {
			currentValue = data.length > 0 ? data[data.length - 1][selectedMetric] : 4.28;
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
		if (!chart || !selectedMetric || !data) return;

		const color = declining ? 'hsl(var(--twc-negative))' : 'hsl(var(--twc-positive))';

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
				showContent: true,
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

								currentValue = value;
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
					showSymbol: true,
					symbol: 'circle',
					symbolSize: 1,
					smooth: true,
					lineStyle: {
						color: color,
						width: 1.25,
						opacity: 1
					},
					//Hover styling prop that works with themes vars
					emphasis: {
						lineStyle: {
							color: color,
							width: 1.25,
							opacity: 1
						},
						itemStyle: {
							color: color
						},
						areaStyle: {
							color: new graphic.LinearGradient(0, 0, 0, 1, [
								{
									offset: 0,
									color: color
								},
								{
									offset: 0.75,
									color: '#f9fafb'
								}
							]),
							opacity: 0.1
						}
					},
					itemStyle: {
						color: color,
						opacity: 1
					},
					areaStyle: {
						color: new graphic.LinearGradient(0, 0, 0, 1, [
							{
								offset: 0,
								color: color
							},
							{
								offset: 0.75,
								color: 'hsl(var(--twc-base-200))'
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

	$: if (chart && selectedMetric && data) {
		updateChartOptions();
	}

	let selectedTimeRange = defaultTimeRange || '1Y';

	$: if (typeof selectedTimeRange === 'string') {
		selectedTimeRange = selectedTimeRange.toUpperCase();
		if (selectedTimeRange === 'ALL') {
			selectedTimeRange = 'All';
		}
	}

	const [send, receive] = crossfade({
		duration: 200,
		easing: cubicInOut
	});
</script>

<div class="grid grid-cols-1 grid-rows-6 gap-y-1 relative">
	<div
		class="print:hidden absolute inset-0 h-full w-full bg-[radial-gradient(hsl(var(--twc-base-300))_1px,transparent_1px)] [background-size:12px_12px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"
	/>
	<div class="row-span-2 relative">
		<div class="font-bold text-base-heading">{selectedMetric}</div>
		<!-- kw: Probably needs to be formatted -->
		<div class="text-sm font-light text-base-content">
			{currentValue ? `$${Number(currentValue.toFixed(2))}` : ''}
		</div>
	</div>
	<div class="row-span-3 relative">
		{#key selectedMetric}
			<div
				class="h-full rounded-lg overflow-visible"
				use:makeChart
				data-testid="time-series-chart"
			></div>
		{/key}
	</div>
	<div class="row-span-1">
		<RadioGroup.Root
			class="flex gap-x-6 text-xs text- font-light justify-end  rounded-md"
			type="single"
			bind:value={selectedTimeRange}
			orientation="horizontal"
		>
			{#each ['1W', '1M', '3M', '1Y', 'YTD', 'All'] as timeRange (timeRange)}
				<RadioGroup.Item
					value={timeRange}
					on:click={() => {
						selectedTimeRange = timeRange;
						store.filterData(selectedTimeRange);
					}}
					class=" rounded cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-200 focus-visible:ring-offset-2"
				>
					<div
						class="hover:text-base-content group-data-[state=checked]:text-base-content text-base-content-muted/80 font-medium relative py-1 transition-colors"
					>
						{timeRange}

						{#if selectedTimeRange === timeRange}
							<div
								in:send={{ key: 'trigger' }}
								out:receive={{ key: 'trigger' }}
								class="absolute bottom-0 left-1/2 h-1 rounded-full w-1 -translate-x-1/2 bg-base-content"
							/>
						{/if}
					</div>
				</RadioGroup.Item>
			{/each}
		</RadioGroup.Root>
	</div>
</div>
