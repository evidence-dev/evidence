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
	import { uiColours } from '@evidence-dev/component-utilities/colours';
	import { getThemeStores } from '../../../themes.js';

	const { resolveColorPalette } = getThemeStores();

	export let data;
	export let queryID;
	export let date;
	export let value;
	export let valueFmt = undefined;

	export let yearLabel = true;
	$: yearLabel = yearLabel === 'true' || yearLabel === true;

	export let monthLabel = true;
	$: monthLabel = monthLabel === 'true' || monthLabel === true;

	export let dayLabel = true;
	$: dayLabel = dayLabel === 'true' || dayLabel === true;

	export let chartAreaHeight = undefined;

	export let title = undefined;
	export let subtitle = undefined;
	let hasTitle = title !== undefined;
	let hasSubtitle = subtitle !== undefined;

	export let legend = true;
	$: legend = legend === 'true' || legend === true;

	export let filter = false;
	$: filter = filter === 'true' || filter === true;

	let height = '400px';
	let gridHeight;

	// TODO this is more of a colorScale than a colorPalette. Should we rename?
	export let colorPalette = ['rgb(254,234,159)', 'rgb(218,66,41)'];
	$: colorPaletteStore = resolveColorPalette(colorPalette);

	export let echartsOptions = undefined;
	export let seriesOptions = undefined;
	export let printEchartsConfig = false;
	$: printEchartsConfig = printEchartsConfig === 'true' || printEchartsConfig === true;

	export let renderer = undefined;
	export let downloadableData = undefined;
	export let downloadableImage = undefined;

	export let connectGroup = undefined;

	function mapColumnsToArray(arrayOfObjects, col1, col2) {
		return arrayOfObjects.map((obj) => [
			new Date(obj[col1]).toISOString().split('T')[0],
			obj[col2]
		]);
	}

	let arrayOfArrays;
	let valueFormat;
	let value_format_object;

	let columnSummary;
	let error;

	let minValue;
	let maxValue;

	let config;
	let baseSeriesConfig;
	let baseCalendarConfig;
	let calendarConfig = [];
	let seriesConfig = [];

	let mobileCalendarConfig;

	export let min = undefined;
	export let max = undefined;

	$: try {
		checkInputs(data, [date, value]);

		const updatedData = data.map((obj) => ({
			...obj,
			year: new Date(obj[date]).getUTCFullYear()
		}));

		const distinctYears = [...new Set(updatedData.map((obj) => obj.year))];

		const yearCount = distinctYears.length;

		arrayOfArrays = mapColumnsToArray(data, date, value);

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

		// ---------------------------------------------------------------------------------------
		// Get column information
		// ---------------------------------------------------------------------------------------
		// Get column summary:
		columnSummary = getColumnSummary(data);
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

		gridHeight = chartAreaHeight ?? Math.max(100, distinctYears.length * 135); // height to add for each row (each item on y axis)
		height = `${0 + legend * 35 + hasTitle * 18 + hasSubtitle * 18 + gridHeight}px`; // chart container height

		baseSeriesConfig = {
			type: 'heatmap',
			coordinateSystem: 'calendar',
			data: arrayOfArrays,
			emphasis: {
				itemStyle: {
					shadowBlur: 2,
					shadowColor: 'rgba(0, 0, 0, 0.5)'
				}
			}
		};

		baseCalendarConfig = {
			left: yearLabel ? 40 : 20,
			right: 5,
			cellSize: ['auto', 13],
			itemStyle: {
				borderWidth: 0.5,
				borderColor: uiColours.grey300
			},
			splitLine: {
				show: true,
				lineStyle: {
					color: uiColours.grey600
				}
			},
			monthLabel: { show: monthLabel, color: uiColours.grey700 },
			dayLabel: { show: dayLabel, color: uiColours.grey700 },
			yearLabel: {
				show: yearLabel,
				color: uiColours.grey300,
				fontSize: 16,
				fontWeight: 600,
				margin: 25
			}
		};
		for (let i = 0; i < yearCount; i++) {
			if (i === 0) {
				seriesConfig = [];
				calendarConfig = [];
			}

			// Create series config
			const seriesData = mapColumnsToArray(
				updatedData.filter((d) => d.year === distinctYears[i]),
				date,
				value
			);
			const thisSeriesConfig = { ...baseSeriesConfig };
			thisSeriesConfig.data = seriesData;
			thisSeriesConfig.calendarIndex = i;

			// Create calendar config
			const thisCalendarConfig = { ...baseCalendarConfig };
			let minDate = seriesData[0][0];
			let maxDate = seriesData[0][0];

			// Loop through the array to find min and max dates
			seriesData.forEach((item) => {
				const currentDate = item[0];
				if (currentDate < minDate) {
					minDate = currentDate;
				}
				if (currentDate > maxDate) {
					maxDate = currentDate;
				}
			});

			thisCalendarConfig.range = distinctYears[i];
			thisCalendarConfig.top = hasTitle * 20 + hasSubtitle * 20 + 25 + i * 135;

			seriesConfig.push(thisSeriesConfig);
			calendarConfig.push(thisCalendarConfig);
		}

		config = {
			title: {
				text: title,
				subtext: subtitle
			},
			animation: false,
			grid: {
				height: gridHeight
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
					<span id="tooltip" style='font-weight: 600;'>${params.value[0]}</span>
						<br/>
						<span>${formatTitle(value, value_format_object)}: </span>
							<span style='float:right; margin-left: 10px;'>${formatValue(
								Number.isNaN(params.value[1]) ? 0 : params.value[1],
								value_format_object
							)}</span>`;

					return tooltipOutput;
				},
				padding: 6,
				borderRadius: 4,
				borderWidth: 1,
				borderColor: uiColours.grey400,
				backgroundColor: 'white',
				extraCssText:
					'box-shadow: 0 3px 6px rgba(0,0,0,.15); box-shadow: 0 2px 4px rgba(0,0,0,.12); z-index: 1;',
				textStyle: {
					color: uiColours.grey900,
					fontSize: 12,
					fontWeight: 400
				},
				order: 'valueDesc'
			},
			calendar: calendarConfig,
			visualMap: {
				show: legend,
				itemWidth: 10,
				min: minValue,
				max: maxValue,
				calculable: filter,
				orient: 'horizontal',
				left: 'center',
				bottom: 10,
				handleStyle: {
					borderColor: uiColours.grey200
				},
				inRange: {
					color: $colorPaletteStore
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
			series: seriesConfig,
			media: [
				{
					query: { maxWidth: 400 },
					option: {
						calendar: []
					}
				}
			]
		};

		mobileCalendarConfig = {
			left: yearLabel ? 40 : 20,
			right: 5,
			cellSize: ['auto', 12],
			itemStyle: {
				borderWidth: 0.5,
				borderColor: uiColours.grey300
			},
			splitLine: {
				show: true,
				lineStyle: {
					color: uiColours.grey600
				}
			},
			monthLabel: {
				show: monthLabel,
				color: uiColours.grey700,
				fontSize: 10,
				formatter: function (param) {
					return param.nameMap.substring(0, 1);
				}
			},
			dayLabel: {
				show: dayLabel,
				color: uiColours.grey700,
				fontSize: 10,
				margin: 7
			},
			yearLabel: {
				show: yearLabel,
				color: uiColours.grey300,
				fontWeight: 600,
				margin: 25,
				fontSize: 14
			}
		};

		for (let i = 0; i < config.calendar.length; i++) {
			config.media[0].option.calendar.push(mobileCalendarConfig);
		}
	} catch (e) {
		error = e.message;
		console.error('Error in Calendar Heatmap: ' + error);
		// if the build is in production fail instead of sending the error to the chart
		if (strictBuild) {
			throw error;
		}
	}
</script>

{#if error}
	<ErrorChart chartType="Calendar Heatmap" {error} />
{:else}
	<ECharts
		{height}
		{data}
		{queryID}
		{config}
		{printEchartsConfig}
		{renderer}
		{downloadableData}
		{downloadableImage}
		{connectGroup}
		{echartsOptions}
		{seriesOptions}
	/>
{/if}
