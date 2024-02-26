<script>
	import { uiColours } from '@evidence-dev/component-utilities/colours';
	import { onMount, onDestroy } from 'svelte';
	import chroma from 'chroma-js';
	import { init, connect as echartsConnect } from 'echarts';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import { browser } from '$app/environment';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import ValueError from './ValueError.svelte';
	import { strictBuild } from '@evidence-dev/component-utilities/chartContext';

	// TO DO
	// 1. Make tooltip gap height dynamic = DONE
	// 2. Fix up sizing to get it right = DONE
	// 3. Alignment of sparkline with BigValue - looks shifted down a bit = DONE
	// 4. Error handling = DONE
	// 5. BigValue sparkline value and date fmts = DONE
	// 6. Optional connection across sparkline instances = DONE
	// 7. Add SSR = DONE
	// 8. Multiple connection groups? = DEFERRING
	// 9. Overlapping labels when connected charts = DEFERRING
	// 10. Some shifting in tooltip labels on mouse move (only when connecteed or not?) = DEFERRING
	// 11. DOCS - Update BigValue page with sparkline props + images; create page for Sparkline + add to all components list
	// 12. Remove tiny-linked-charts = DONE
	// 13. Tree shake echarts imports = DONE
	// 14. Remove echarts disposal logs = DONE
	// 15. Check negative value behaviour = DONE

	export let config = {};
	export let width = 50; // Default width for the sparkline, adjust as needed
	export let height = 15; // Default height for the sparkline, adjust as needed
	export let interactive = false; // Prop to control interactivity
	$: interactive = interactive === 'true' || interactive === true;

	let chartContainer;
	let chartInstance = null;
	let staticSVG = ''; // Holds the static SVG markup

	export let data = undefined;
	export let dateCol = undefined;
	export let valueCol = undefined;
	export let valueFmt = undefined;
	let valueFormat;
	let value_format_object;
	let columnSummary;

	export let dateFmt = undefined;
	let dateFormat;
	let date_format_object;

	export let type = 'line'; // line, area, or bar

	export let color = undefined;

	export let yScale = false; // scale the y axis to the data
	$: yScale = yScale === 'true' || yScale === true;

	let seriesType = type === 'area' ? 'line' : type;

	export let connect = false; // connects to all other connected sparklines (shared tooltip behaviour)
	$: connect = connect === 'true' || connect === true;

	let staticSVGSSR;
	let error;

	$: try {
		// ---------------------------------------------------------------------------------------
		// Get column information
		// ---------------------------------------------------------------------------------------

		if (!['line', 'area', 'bar'].includes(type)) {
			throw Error('type must be line, area, or bar');
		}

		if (height) {
			// if height was user-supplied
			height = Number(height);
			if (isNaN(height)) {
				// input must be a number
				throw Error('height must be a number');
			} else if (height <= 0) {
				throw Error('height must be a positive number');
			}
		} else {
			height = 15;
		}

		if (width) {
			// if width was user-supplied
			width = Number(width);
			if (isNaN(width)) {
				// input must be a number
				throw Error('width must be a number');
			} else if (width <= 0) {
				throw Error('width must be a positive number');
			}
		} else {
			width = 50;
		}

		checkInputs(data, [valueCol, dateCol]);

		// Get column summary:
		columnSummary = getColumnSummary(data);
		// Get formats:
		valueFormat = columnSummary[valueCol].format;
		dateFormat = columnSummary[dateCol].format;

		// Set column formats
		value_format_object = valueFmt ? getFormatObjectFromString(valueFmt) : valueFormat;
		date_format_object = dateFmt ? getFormatObjectFromString(dateFmt) : dateFormat;

		const sparklineData = data.map((d) => [d[dateCol], d[valueCol]]);
		sparklineData.sort((a, b) => a[0] - b[0]);

		config = {
			title: {
				subtextStyle: {
					width: '100%'
				}
			},
			tooltip: {
				trigger: 'axis',
				position: function (point, params, dom, rect, size) {
					// Calculate horizontal center and a fixed vertical offset
					const horizontalCenter = size.viewSize[0] / 2 - size.contentSize[0] / 2;
					const verticalOffset = -13.5; // Adjust this value to position the tooltip above the chart
					return [horizontalCenter, verticalOffset];
				},
				formatter: function (params) {
					// Assuming params[0] is your primary data point
					const dataPoint = params[0];
					// Customize these HTML blocks as needed
					const valuePart = `<div style="text-align: center; background-color: transparent; border-radius: 1px; padding: 0px 2px; height: 12px;">${formatValue(
						dataPoint.value[1],
						value_format_object
					)}</div>`;
					const transparentGap = `<div style="height: ${height + 1.5}px;"></div>`; // Adjust height for the gap size
					const datePart = `<div style="text-align: center; height: 1em; background-color: transparent; border-radius: 1px; padding: 0px 2px;">${formatValue(
						dataPoint.axisValueLabel,
						date_format_object
					)}</div>`;

					return valuePart + transparentGap + datePart;
				},
				backgroundColor: 'transparent', // Semi-transparent white background
				borderWidth: 0,
				borderColor: 'transparent',
				extraCssText: 'box-shadow: none; padding-bottom: 0;', // Optional: Add some shadow for depth
				padding: 0,
				textStyle: {
					fontSize: 10
				}
			},
			legend: {
				show: false,
				type: 'scroll',
				top: 0,
				padding: [0, 0, 0, 0]
			},
			grid: {
				// show: true,
				left: 0,
				right: 0,
				bottom: 0,
				top: 0,
				containLabel: true
				//   borderColor: 'red',
				//   borderWidth: 1
			},
			xAxis: {
				type: 'time',
				splitLine: {
					show: false
				},
				axisLine: {
					show: true,
               lineStyle: {
                  width: 0.75,
                  color: uiColours.grey500
               }
				},
				axisTick: {
					show: false
				},
				axisLabel: {
					show: false,
					hideOverlap: true,
					showMaxLabel: false,
					formatter: false,
					margin: 6
				},
				scale: true,
				z: 2,
				boundaryGap: '2%',
				axisPointer: {
					show: true,
					snap: true,
					type: 'line',
					z: 0,
					lineStyle: {
						width: 0.5
					},
					handle: {
						show: false
					},
					label: {
						show: false
					}
				}
			},
			yAxis: [
				{
					type: 'value',
					logBase: 10,
					splitLine: {
						show: false
					},
					axisLine: {
						show: false,
						onZero: false
					},
					axisTick: {
						show: false
					},
					axisLabel: {
						show: false,
						hideOverlap: true,
						margin: 4
					},
					name: '',
					nameLocation: 'end',
					nameTextStyle: {
						align: 'left',
						verticalAlign: 'top',
						padding: [0, 5, 0, 0]
					},
					nameGap: 6,
					scale: yScale,
					boundaryGap: ['1%', '1%'],
					z: 2
				}
			],
			series: [
				{
					type: seriesType,
					triggerLineEvent: true,
					label: {
						show: false,
						fontSize: 11,
						position: 'top',
						padding: 0,
						fontSize: 9
					},
					labelLayout: {
						hideOverlap: true
					},
					connectNulls: false,
					emphasis: {
						disabled: true
					},
					lineStyle: {
						width: 1,
						type: 'solid',
						color: color ?? uiColours.grey400
					},
					areaStyle: {
						color:
							type === 'area'
								? color
									? chroma(color).brighten(1.5).hex()
									: uiColours.grey300
								: 'transparent'
					},
					itemStyle: {
						color: color ?? uiColours.grey400
					},
					showSymbol: false,
					symbol: 'circle',
					symbolSize: 0,
					step: false,
					name: 'sparkline',
					data: sparklineData,
					yAxisIndex: 0
				}
			],
			animation: false,
			graphic: {
				id: 'horiz-axis-title',
				type: 'text',
				style: {
					text: '',
					textAlign: 'right',
					fill: 'hsla(212, 10%, 53%, 1)'
				},
				cursor: 'auto',
				right: '3%',
				top: null,
				bottom: '2%'
			}
		};

		// Initialize chart for interactive mode
		function initializeChart() {
			if (interactive && chartContainer && !chartInstance) {
				chartInstance = init(chartContainer, null, { renderer: 'svg', width, height });
				chartInstance.setOption(config);
				if (connect) {
					chartInstance.group = 'connected-sparkline';
					echartsConnect('connected-sparkline');
				}
			}
		}

		if (!browser) {
			// SSR-specific initialization
			const tempChart = init(null, 'evidence-light', {
				ssr: true,
				renderer: 'svg',
				height: height,
				width: width
			});
			tempChart.setOption(config);
			staticSVGSSR = tempChart.renderToSVGString();
			tempChart.dispose(); // Dispose instance after generating SVG
		}

		// Initialize the static SVG
		onMount(() => {
			if (!interactive) {
				// Generate static SVG for non-interactive mode
				const offscreenContainer = document.createElement('div');
				offscreenContainer.style.width = width + 'px';
				offscreenContainer.style.height = height + 'px';
				const tempChart = init(offscreenContainer, null, { renderer: 'svg', height, width });
				tempChart.setOption(config);
				staticSVG = tempChart.renderToSVGString();
				tempChart.dispose();
			} else {
				initializeChart();
			}
		});

		if (chartContainer && interactive && !chartInstance) {
			initializeChart();
		}

		// Cleanup
		onDestroy(() => {
			if (chartInstance) {
				chartInstance.dispose();
			}
		});
	} catch (e) {
      error = e;
		const setTextRed = '\x1b[31m%s\x1b[0m';
		console.error(setTextRed, `Error in Sparkline: ${error.message}`);
		if (strictBuild) {
			throw error;
		}
	}

   $: data, config;
</script>

{#if error}
	<ValueError {error} />
{:else if !browser}
	<div
		class="inline-block align-baseline border-blue-600 border-0"
		style="width: {width}px; height: {height}px;"
	>
		{@html staticSVGSSR}
	</div>
{:else if !interactive}
	<div
		class="inline-block align-baseline border-blue-600 border-0"
		style="width: {width}px; height: {height}px;"
	>
		{@html staticSVG}
	</div>
{:else}
	<div
		bind:this={chartContainer}
		class="z-50 inline-block align-baseline overflow-visible border-blue-400 border-0"
		style="width: {width}px; height: {height}px;"
	/>
{/if}
