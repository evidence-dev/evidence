<script>
	import { init, graphic } from 'echarts';
	import { ToggleGroup } from 'bits-ui';

	let fakeData = [
		{ date: '2024-01-02', value: 0.931 },
		{ date: '2024-01-01', value: 0.941 },
		{ date: '2024-01-02', value: 0.931 },
		{ date: '2024-01-03', value: 0.924 },
		{ date: '2024-01-04', value: 0.897 },
		{ date: '2024-01-05', value: 0.898 },
		{ date: '2024-01-06', value: 0.926 },
		{ date: '2024-01-07', value: 1.028 },
		{ date: '2024-01-08', value: 1.047 },
		{ date: '2024-01-09', value: 1.071 },
		{ date: '2024-01-10', value: 1.078 },
		{ date: '2024-01-11', value: 0.989 },
		{ date: '2024-01-12', value: 0.998 },
		{ date: '2024-01-13', value: 1.011 },
		{ date: '2024-01-14', value: 1.155 },
		{ date: '2024-01-15', value: 1.156 },
		{ date: '2024-01-16', value: 1.185 },
		{ date: '2024-01-17', value: 1.195 },
		{ date: '2024-01-18', value: 1.138 },
		{ date: '2024-01-19', value: 1.217 },
		{ date: '2024-01-20', value: 1.277 },
		{ date: '2024-01-21', value: 1.341 },
		{ date: '2024-01-22', value: 1.295 },
		{ date: '2024-01-23', value: 1.403 },
		{ date: '2024-01-24', value: 1.321 },
		{ date: '2024-01-25', value: 1.374 },
		{ date: '2024-01-26', value: 1.441 },
		{ date: '2024-01-27', value: 1.524 },
		{ date: '2024-01-28', value: 1.485 },
		{ date: '2024-01-29', value: 1.563 },
		{ date: '2024-01-30', value: 1.613 },
		{ date: '2024-01-31', value: 1.565 },
		{ date: '2024-02-01', value: 1.614 },
		{ date: '2024-02-02', value: 1.647 },
		{ date: '2024-02-03', value: 1.612 },
		{ date: '2024-02-04', value: 1.635 },
		{ date: '2024-02-05', value: 1.655 },
		{ date: '2024-02-06', value: 1.624 },
		{ date: '2024-02-07', value: 1.671 },
		{ date: '2024-02-08', value: 1.698 },
		{ date: '2024-02-09', value: 1.655 },
		{ date: '2024-02-10', value: 1.682 },
		{ date: '2024-02-11', value: 1.712 },
		{ date: '2024-02-12', value: 1.685 },
		{ date: '2024-02-13', value: 1.721 },
		{ date: '2024-02-14', value: 1.754 },
		{ date: '2024-02-15', value: 1.721 },
		{ date: '2024-02-16', value: 1.745 },
		{ date: '2024-02-17', value: 1.768 },
		{ date: '2024-02-18', value: 1.725 },
		{ date: '2024-02-19', value: 1.751 },
		{ date: '2024-02-20', value: 1.778 },
		{ date: '2024-02-21', value: 1.737 },
		{ date: '2024-02-22', value: 1.764 },
		{ date: '2024-02-23', value: 1.792 },
		{ date: '2024-02-24', value: 1.755 },
		{ date: '2024-02-25', value: 1.783 },
		{ date: '2024-02-26', value: 1.812 },
		{ date: '2024-02-27', value: 0.785 },
		{ date: '2024-02-28', value: 0.814 },
		{ date: '2024-02-29', value: 0.844 },
		{ date: '2024-03-01', value: 0.817 },
		{ date: '2024-03-02', value: 0.847 },
		{ date: '2024-03-03', value: 0.978 },
		{ date: '2024-03-04', value: 1.851 },
		{ date: '2024-03-05', value: 1.883 },
		{ date: '2024-03-06', value: 1.915 },
		{ date: '2024-03-07', value: 1.889 },
		{ date: '2024-03-08', value: 1.922 },
		{ date: '2024-03-09', value: 1.955 },
		{ date: '2024-03-10', value: 1.929 },
		{ date: '2024-03-11', value: 1.964 },
		{ date: '2024-03-12', value: 2.0 },
		{ date: '2024-03-13', value: 1.975 },
		{ date: '2024-03-14', value: 2.011 },
		{ date: '2024-03-15', value: 2.048 },
		{ date: '2024-03-16', value: 2.02 },
		{ date: '2024-03-17', value: 2.057 },
		{ date: '2024-03-18', value: 2.094 },
		{ date: '2024-03-19', value: 2.069 },
		{ date: '2024-03-20', value: 2.107 },
		{ date: '2024-03-21', value: 2.145 },
		{ date: '2024-03-22', value: 2.12 },
		{ date: '2024-03-23', value: 2.159 },
		{ date: '2024-03-24', value: 2.198 },
		{ date: '2024-03-25', value: 2.174 },
		{ date: '2024-03-26', value: 2.213 },
		{ date: '2024-03-27', value: 2.253 },
		{ date: '2024-03-28', value: 2.229 },
		{ date: '2024-03-29', value: 2.269 },
		{ date: '2024-03-30', value: 2.309 },
		{ date: '2024-03-31', value: 2.285 }
	];

	const makeChart = (node) => {
		const chart = init(node, null, { renderer: 'svg' });
		chart.setOption({
			animation: false,

			dataset: {
				source: fakeData
			},
			xAxis: {
				type: 'time',
				show: false
			},
			yAxis: {
				type: 'value',
				show: false
			},
			series: [
				{
					name: 'vvv',
					type: 'line',
					silent: true,
					showSymbol: false,
					smooth: true,
					lineStyle: {
						color: '#16a34a',
						width: 1.25,
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

		window.addEventListener('resize', function () {
			chart.resize();
		});

		return {
			destroy() {
				chart.dispose();
			}
		};
	};
	let selectedTimeRange = '1Y';
</script>

<div class="p-2 relative ">
	<div class="absolute top-2 left-2 z-10 bg-gradient-to-br from-gray-50/90 via-gray-50/60 to-gray-50/30 rounded pr-3">
		<span class="block font-bold text-gray-800">ARR</span>
		<span class="block text-sm font-light text-gray-800 rounded">$4.28M</span>
	</div>
	<div class="flex flex-col justify-between">
		<div class="min-h-32 flex-grow rounded-lg overflow-clip relative" use:makeChart>
			<div
				class="print:hidden absolute inset-0 h-full w-full bg-gray-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"
			/>
		</div>
		<div>
			<ToggleGroup.Root
				class="flex gap-1 text-xs text-gray-600 font-light justify-end z-20"
				type="single"
				bind:value={selectedTimeRange}
			>
				{#each ['1W', '1M', '3M', '1Y', 'YTD', 'All'] as timeRange (timeRange)}
					<ToggleGroup.Item
						value={timeRange}
						class="hover:bg-gray-100 py-0.5 px-3 rounded cursor-pointer data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 data-[state=on]:font-medium transition-all duration-200"
					>
						{timeRange}
					</ToggleGroup.Item>
				{/each}
			</ToggleGroup.Root>
		</div>
	</div>
</div>
