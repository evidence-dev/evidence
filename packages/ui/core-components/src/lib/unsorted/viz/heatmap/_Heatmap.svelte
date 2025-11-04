<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import ECharts from '../core/ECharts.svelte';
	import ErrorChart from '../core/ErrorChart.svelte';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import { strictBuild } from '@evidence-dev/component-utilities/chartContext';
	import formatTitle from '@evidence-dev/component-utilities/formatTitle';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import getDistinctValues from '@evidence-dev/component-utilities/getDistinctValues';
	import getSortedDistinctValues from '@evidence-dev/component-utilities/getSortedDistinctValues';
	import getCompletedData from '@evidence-dev/component-utilities/getCompletedData';
	import { getThemeStores } from '../../../themes/themes.js';
	import { toBoolean } from '../../../utils.js';

	const { theme, resolveColorScale } = getThemeStores();

	export let data;
	export let queryID;
	export let x;
	export let y;
	export let xSort = undefined;
	export let xSortOrder = 'asc';
	export let ySort = undefined;
	export let ySortOrder = 'asc';
	export let value;
	export let valueFmt;
	export let valueLabels = true;
	$: valueLabels = valueLabels === 'true' || valueLabels === true;

	export let mobileValueLabels = false;
	$: mobileValueLabels = mobileValueLabels === 'true' || mobileValueLabels === true;

	export let xAxisPosition = 'top'; // top | bottom

	export let xTickMarks = false;
	$: xTickMarks = xTickMarks === 'true' || xTickMarks === true;

	export let yTickMarks = false;
	$: yTickMarks = yTickMarks === 'true' || yTickMarks === true;

	export let title = undefined;
	export let subtitle = undefined;

	let hasTitle = title !== undefined;
	let hasSubtitle = subtitle !== undefined;

	export let borders = true;
	$: borders = borders === 'true' || borders === true;

	export let legend = true;
	$: legend = legend === 'true' || legend === true;

	export let filter = false;
	$: filter = filter === 'true' || filter === true;

	/** @deprecated Use `colorScale` instead */
	export let colorPalette = undefined;
	export let colorScale = undefined;
	$: colorScaleStore = resolveColorScale(colorScale ?? colorPalette ?? 'default');

	export let min = undefined;
	export let max = undefined;

	export let chartAreaHeight = undefined;

	export let xLabelRotation = undefined; // degress to rotate x axis labels

	export let echartsOptions = undefined;
	export let seriesOptions = undefined;
	export let printEchartsConfig = false;
	$: printEchartsConfig = printEchartsConfig === 'true' || printEchartsConfig === true;

	export let leftPadding = 0; // user option to avoid label cutoffs
	export let rightPadding = 2; // user option to avoid label cutoffs
	export let cellHeight = 30;

	export let renderer = undefined;
	export let downloadableData = true;
	export let downloadableImage = true;

	$: downloadableData = toBoolean(downloadableData);
	$: downloadableImage = toBoolean(downloadableImage);

	export let connectGroup = undefined;

	export let nullsZero = true; // if nulls or missing records should display as zero or missing values (blank grey squares)
	$: nullsZero = toBoolean(nullsZero);
	export let zeroDisplay = '—'; // what to display in place of zeros

	$: height = undefined;
	$: gridHeight = undefined;

	function mapColumnsToArray(arrayOfObjects, col1, col2, col3) {
		// x and y must be converted to strings, otherwise echarts will interpret them as index positions
		return arrayOfObjects.map((obj) => [`${obj[col1]}`, `${obj[col2]}`, obj[col3]]);
	}
	let xDistinct;
	let yDistinct;
	let arrayOfArrays;
	let valueFormat;
	let value_format_object;

	let columnSummary;
	let error;

	let minValue;
	let maxValue;

	let config;

	$: try {
		checkInputs(data, [x, y, value]);

		data = getCompletedData(data, x, value, y, nullsZero); // works slightly differently than regular chart - requires y column to be treated as series for this function

		if (min) {
			// if min was user-supplied
			min = Number(min);
			if (isNaN(min)) {
				// input must be a number
				throw Error('min must be a number');
			}
		}

		if (max) {
			// if max was user-supplied
			max = Number(max);
			if (isNaN(max)) {
				// input must be a number
				throw Error('max must be a number');
			}
		}

		minValue = min ?? Math.min(...data.map((d) => d[value]));
		maxValue = max ?? Math.max(...data.map((d) => d[value]));

		xDistinct = xSort
			? getSortedDistinctValues(data, x, xSort, xSortOrder)
			: getDistinctValues(data, x);
		yDistinct = ySort
			? getSortedDistinctValues(data, y, ySort, ySortOrder)
			: getDistinctValues(data, y);

		arrayOfArrays = mapColumnsToArray(data, x, y, value);

		// ---------------------------------------------------------------------------------------
		// Get column information
		// ---------------------------------------------------------------------------------------
		// Get column summary:
		columnSummary = getColumnSummary(data);

		// Check that x and y columns are strings
		if (columnSummary[x].type === 'date' || columnSummary[y].type === 'date') {
			throw Error(
				'Heatmap can only accept string or numeric columns for x and y. If you would like to show dates, cast them to strings in your SQL query before using in the Heatmap.'
			);
		}

		// Get formats:
		valueFormat = columnSummary[value].format;

		// Set column formats
		value_format_object = valueFmt ? getFormatObjectFromString(valueFmt) : valueFormat;

		// ---------------------------------------------------------------------------------------
		// Set chart container height
		// ---------------------------------------------------------------------------------------

		if (chartAreaHeight) {
			// if chartAreaHeight was user-supplied
			chartAreaHeight = Number(chartAreaHeight);
			if (isNaN(chartAreaHeight)) {
				// input must be a number
				throw Error('chartAreaHeight must be a number');
			} else if (chartAreaHeight <= 0) {
				throw Error('chartAreaHeight must be a positive number');
			}
		}

		gridHeight = chartAreaHeight ?? Math.max(100, yDistinct.length * cellHeight); // height to add for each row (each item on y axis)
		height = `${20 + legend * 35 + hasTitle * 18 + hasSubtitle * 18 + gridHeight}px`; // chart container height
		config = {
			textStyle: {
				fontFamily: 'sans-serif'
			},
			title: {
				text: title,
				subtext: subtitle
			},
			animation: false,
			grid: {
				height: gridHeight,
				top: hasTitle * 20 + hasSubtitle * 20 + 8,
				left: leftPadding,
				right: rightPadding
			},
			xAxis: {
				type: 'category',
				data: xDistinct,
				splitArea: {
					show: true
				},
				axisTick: {
					show: xTickMarks,
					alignWithLabel: false
				},
				axisLabel: {
					interval: 0,
					hideOverlap: true,
					rotate: xLabelRotation
				},
				position: xAxisPosition
			},
			yAxis: {
				type: 'category',
				inverse: true,
				data: yDistinct,
				splitArea: {
					show: true
				},
				axisTick: {
					show: yTickMarks,
					alignWithLabel: false
				}
			},
			tooltip: {
				trigger: 'item',
				showDelay: 0,
				transitionDuration: 0.2,
				confine: true,
				axisPointer: {
					// Use axis to trigger tooltip
					type: 'shadow' // 'shadow' as default; can also be 'line' or 'shadow'
				},
				formatter: function (params) {
					let tooltipOutput = `
					<span id="tooltip" style='font-weight: 600;'>${params.value[1]}</span>
						<br/>
					<span id="tooltip" style='font-weight: 600;'>${params.name}</span>
						<br/>
						<span>${formatTitle(value, value_format_object)}: </span>
							<span style='float:right; margin-left: 10px;'>${
								params.value[2] === 0
									? zeroDisplay
									: formatValue(
											Number.isNaN(params.value[2]) ? 0 : params.value[2],
											value_format_object
										)
							}</span>`;

					return tooltipOutput;
				},
				padding: 6,
				borderRadius: 4,
				borderWidth: 1,
				borderColor: $theme.colors['base-300'],
				backgroundColor: $theme.colors['base-100'],
				extraCssText:
					'box-shadow: 0 3px 6px rgba(0,0,0,.15); box-shadow: 0 2px 4px rgba(0,0,0,.12); z-index: 1;',
				textStyle: {
					color: $theme.colors['base-content'],
					fontSize: 12,
					fontWeight: 400
				},
				order: 'valueDesc'
			},
			visualMap: {
				itemWidth: 10,
				show: legend,
				min: minValue,
				max: maxValue,
				calculable: filter,
				orient: 'horizontal',
				left: 'center',
				bottom: '0%',
				textStyle: {
					color: $theme.colors['base-content-muted']
				},
				handleStyle: {
					borderColor: $theme.colors['base-100']
				},
				inRange: {
					color: $colorScaleStore
				},
				text: filter
					? undefined
					: [
							formatValue(maxValue, value_format_object),
							formatValue(minValue, value_format_object)
						],
				formatter: function (value) {
					return formatValue(value, value_format_object);
				}
			},
			series: [
				{
					type: 'heatmap',
					data: arrayOfArrays,
					label: {
						show: valueLabels,
						formatter: function (params) {
							return params.value[2] === 0
								? zeroDisplay
								: formatValue(params.value[2], value_format_object);
						}
					},
					labelLayout: {
						hideOverlap: true
					},
					itemStyle: {
						borderColor: $theme.colors['base-300'],
						borderWidth: borders ? 0.5 : 0
					}
				}
			],
			media: [
				{
					query: { maxWidth: 400 },
					option: {
						series: {
							label: {
								show: mobileValueLabels
							}
						}
					}
				},
				{
					query: { minWidth: 400 },
					option: {
						series: {
							label: {
								show: valueLabels
							}
						}
					}
				}
			]
		};
	} catch (e) {
		error = e.message;
		console.error('Error in Heatmap: ' + e.message);
		// if the build is in production fail instead of sending the error to the chart
		if (strictBuild) {
			throw error;
		}
	}

	$: (data, height, config);
</script>

{#if error}
	<ErrorChart title="Heatmap" {error} />
{:else}
	<ECharts
		{data}
		{queryID}
		{config}
		{height}
		{echartsOptions}
		{seriesOptions}
		{printEchartsConfig}
		evidenceChartTitle={title}
		{renderer}
		{downloadableData}
		{downloadableImage}
		{connectGroup}
	/>
{/if}
