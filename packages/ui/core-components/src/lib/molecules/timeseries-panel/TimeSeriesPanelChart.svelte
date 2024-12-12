<script>
	import { init, graphic } from 'echarts';
	import { RadioGroup } from 'bits-ui';
	// import { blur, fly, fade } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';
	// import {
	// 	CalendarDate,
	// 	DateFormatter,
	// 	getLocalTimeZone,
	// 	startOfMonth,
	// 	endOfMonth,
	// 	startOfYear,
	// 	endOfYear
	// } from '@internationalized/date';

	export let data;
	export let selectedMetric = undefined;
	export let declining = false;
	export let store;
	export let defaultTimeRange = undefined;

	let chart;
	// $: lastDate = data.length > 0 ? new Date(data[data.length - 1].date) : new Date();
	// $: filteredData = filterDataByTimeRange(data, lastDate, selectedTimeRange);
	$: currentValue = data.length > 0 ? data[data.length - 1][selectedMetric] : null;
	// $: if (selectedTimeRange) {
	// 	filteredData = filterDataByTimeRange(data, lastDate, selectedTimeRange);
	// }

	// function filterDataByTimeRange(data, lastDate, timeRange) {
	// 	const endDate = new Date(lastDate);
	// 	let startDate;

	// 	switch (timeRange) {
	// 		case '1W':
	// 			startDate = new Date(endDate);
	// 			startDate.setDate(startDate.getDate() - 7);
	// 			break;
	// 		case '1M':
	// 			startDate = new Date(endDate);
	// 			startDate.setMonth(startDate.getMonth() - 1);
	// 			break;
	// 		case '3M':
	// 			startDate = new Date(endDate);
	// 			startDate.setMonth(startDate.getMonth() - 3);
	// 			break;
	// 		case '1Y':
	// 			startDate = new Date(endDate);
	// 			startDate.setFullYear(startDate.getFullYear() - 1);
	// 			break;
	// 		case 'YTD':
	// 			startDate = new Date(endDate.getFullYear(), 0, 1);
	// 			break;
	// 		case 'All':
	// 			return data;
	// 		default:
	// 			startDate = new Date(endDate);
	// 			startDate.setFullYear(startDate.getFullYear() - 1);
	// 	}

	// 	return data.filter(
	// 		(item) => new Date(item.date) >= startDate && new Date(item.date) <= endDate
	// 	);
	// }

	// $: filteredData = filterDataByTimeRange(data, lastDate, selectedTimeRange);

	// $: if (selectedTimeRange) {
	// 	store.filterData(data, selectedTimeRange);
	// }

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

		const color = declining ? '#dc2626' : '#16a34a';
		const gradientColor = declining ? '#ef4444' : '#22c55e';

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
					showSymbol: false,
					symbol: 'circle',
					symbolSize: 1,
					smooth: true,
					lineStyle: {
						color: color,
						width: 1.25,
						opacity: 1
					},
					itemStyle: {
						color: color,
						opacity: 1
					},
					areaStyle: {
						color: new graphic.LinearGradient(0, 0, 0, 1, [
							{
								offset: 0,
								color: gradientColor
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

<div class="grid grid-rows-6 gap-y-1 relative">
	<div
		class="print:hidden absolute inset-0 h-full w-full bg-gray-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"
	/>
	<div class="row-span-2 relative">
		<div class="font-bold text-gray-700">{selectedMetric}</div>
		<!-- kw: Probably needs to be formatted -->
		<div class="text-sm font-light text-gray-800">
			{currentValue ? `$${Number(currentValue.toFixed(2))}` : ''}
		</div>
	</div>
	<div class="row-span-3 relative">
		{#key selectedMetric}
			<div
				class="h-full rounded-lg overflow-clip"
				use:makeChart
				data-testid="time-series-chart"
			></div>
		{/key}
	</div>
	<div class="row-span-1">
		<RadioGroup.Root
			class="flex gap-1 text-xs text-gray-600 font-light justify-end "
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
						class="hover:text-gray-700 group-data-[state=checked]:text-gray-700 text-gray-400 font-medium relative py-1 px-3 transition-colors"
					>
						{timeRange}

						{#if selectedTimeRange === timeRange}
							<div
								in:send={{ key: 'trigger' }}
								out:receive={{ key: 'trigger' }}
								class="absolute bottom-0 left-1/2 h-1 rounded-full w-1 -translate-x-1/2 bg-gray-900"
							/>
						{/if}
					</div>
				</RadioGroup.Item>
			{/each}
		</RadioGroup.Root>
	</div>
</div>
