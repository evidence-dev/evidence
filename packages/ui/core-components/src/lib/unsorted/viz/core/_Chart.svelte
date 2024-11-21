<script>
	import { writable } from 'svelte/store';
	import { setContext } from 'svelte';
	import { propKey, configKey, strictBuild } from '@evidence-dev/component-utilities/chartContext';
	let props = writable({});
	/** @type {import("svelte/store").Writable<import("echarts").Options>} */
	let config = writable({});

	$: setContext(propKey, props);
	$: setContext(configKey, config);

	import ECharts from './ECharts.svelte';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import getDistinctValues from '@evidence-dev/component-utilities/getDistinctValues';
	import getDistinctCount from '@evidence-dev/component-utilities/getDistinctCount';
	import getStackPercentages from '@evidence-dev/component-utilities/getStackPercentages';
	import getSortedData from '@evidence-dev/component-utilities/getSortedData';
	import getYAxisIndex from '@evidence-dev/component-utilities/getYAxisIndex';
	import { standardizeDateColumn } from '@evidence-dev/component-utilities/dateParsing';
	import { formatAxisValue } from '@evidence-dev/component-utilities/formatting';
	import formatTitle from '@evidence-dev/component-utilities/formatTitle';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import ErrorChart from './ErrorChart.svelte';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import { getThemeStores } from '../../../themes/themes.js';

	const { theme, resolveColor, resolveColorsObject, resolveColorPalette } = getThemeStores();

	// ---------------------------------------------------------------------------------------
	// Input Props
	// ---------------------------------------------------------------------------------------
	// Data and columns:
	export let data = undefined;
	export let queryID = undefined;
	export let x = undefined;
	export let y = undefined;
	export let y2 = undefined;
	export let series = undefined;
	export let size = undefined;
	export let tooltipTitle = undefined;

	export let showAllXAxisLabels = false;

	export let printEchartsConfig = false; // helper for custom chart development
	$: printEchartsConfig = printEchartsConfig === 'true' || printEchartsConfig === true;

	// This should be reworked to fit better with svelte's reactivity.

	// We rewrite the x and y values with fallbacks if they aren't present
	// the fallback logic *depends* on the values of x and y
	// when x and y are replaced by the fallbacks, the fallback logic doesn't reset.
	// if the y value isn't set, var y gets populated with a fall back from the data.
	// if the data changes, we are now acting as if the fallback from above was entered by the user, and
	// then we throw if the fallback column is now missing.

	// This is a hack to get around the above
	// Reactively updated below to prevent circular reactivity
	let ySet = y ? true : false;
	// const y2Set = y2 ? true : false;
	let xSet = x ? true : false;

	export let swapXY = false; // Flipped axis chart
	$: if (swapXY === 'true' || swapXY === true) {
		swapXY = true;
	} else {
		swapXY = false;
	}

	// Chart titles:
	export let title = undefined;
	export let subtitle = undefined;

	// Chart type:
	export let chartType = 'Chart'; // Used to label chart error messages
	export let bubble = false;
	export let hist = false;
	export let boxplot = false;
	let reqCols;

	// X axis:
	export let xType = undefined; // category or value
	export let xAxisTitle = 'false'; // Default false. If true, use formatTitle(x). Or you can supply a custom string
	export let xBaseline = true;
	$: xBaseline = xBaseline === 'true' || xBaseline === true;
	export let xTickMarks = false;
	$: xTickMarks = xTickMarks === 'true' || xTickMarks === true;
	export let xGridlines = false;
	$: xGridlines = xGridlines === 'true' || xGridlines === true;
	export let xAxisLabels = true;
	$: xAxisLabels = xAxisLabels === 'true' || xAxisLabels === true;
	export let sort = true; // sorts x values in case x is out of order in dataset (e.g., would create line chart that is out of order)
	$: sort = sort === 'true' || sort === true;
	export let xFmt = undefined;
	export let xMin = undefined;
	export let xMax = undefined;

	// Y axis:
	export let yLog = false;
	$: yLog = yLog === 'true' || yLog === true;
	export let yType = yLog === true ? 'log' : 'value'; // value or log
	export let yLogBase = 10;
	export let yAxisTitle = 'false'; // Default false. If true, use formatTitle(x). Or you can supply a custom string
	export let yBaseline = false;
	$: yBaseline = yBaseline === 'true' || yBaseline === true;

	export let yTickMarks = false;
	$: yTickMarks = yTickMarks === 'true' || yTickMarks === true;
	export let yGridlines = true;
	$: yGridlines = yGridlines === 'true' || yGridlines === true;
	export let yAxisLabels = true;
	$: yAxisLabels = yAxisLabels === 'true' || yAxisLabels === true;

	export let yMin = undefined;
	export let yMax = undefined;
	export let yScale = false;
	$: yScale = yScale === 'true' || yScale === true;
	export let yFmt = undefined;

	export let yAxisColor = 'true';
	$: yAxisColorStore = resolveColor(yAxisColor);

	// Y2 axis:
	export let y2AxisTitle = 'false'; // Default false. If true, use formatTitle(x). Or you can supply a custom string
	export let y2Baseline = false;
	$: y2Baseline = y2Baseline === 'true' || y2Baseline === true;
	export let y2TickMarks = false;
	$: y2TickMarks = y2TickMarks === 'true' || y2TickMarks === true;
	export let y2Gridlines = true;
	$: y2Gridlines = y2Gridlines === 'true' || y2Gridlines === true;
	export let y2AxisLabels = true;
	$: y2AxisLabels = y2AxisLabels === 'true' || y2AxisLabels === true;
	export let y2Min = undefined;
	export let y2Max = undefined;
	export let y2Scale = false;
	$: y2Scale = y2Scale === 'true' || y2Scale === true;
	export let y2Fmt = undefined;

	export let y2AxisColor = 'true';
	$: y2AxisColorStore = resolveColor(y2AxisColor);

	// Other column formats:
	export let sizeFmt = undefined;

	// Color palette:
	export let colorPalette = 'default';
	$: colorPaletteStore = resolveColorPalette(colorPalette);

	// Legend:
	export let legend = undefined;

	// Additional Config Options:
	export let echartsOptions = undefined; // additional ECharts config object that will append to the config generated by our API
	export let seriesOptions = undefined; // additional ECharts config object that will be applied to every series in the config

	export let seriesColors = undefined;
	$: seriesColorsStore = resolveColorsObject(seriesColors);

	export let stackType = undefined; // used in BarChart (stacked, grouped) and AreaChart (stacked)
	export let stacked100 = false;

	export let chartAreaHeight;

	export let renderer = undefined; // can be canvas (default) or SVG
	export let downloadableData = true;
	$: downloadableData = downloadableData === 'true' || downloadableData === true;
	export let downloadableImage = true;
	$: downloadableImage = downloadableImage === 'true' || downloadableImage === true;

	export let connectGroup = undefined; // string represent name of group for connected charts. Charts with same connectGroup will have connected interactions

	// ---------------------------------------------------------------------------------------
	// Variable Declaration
	// ---------------------------------------------------------------------------------------
	// Column Summary:
	let columnSummary;
	let columnNames;
	let uColNames = [];
	let unusedColumns = [];
	let uColType;
	let uColName;
	let xDataType;
	let xMismatch;
	let xFormat;
	let yFormat;
	let y2Format;
	let sizeFormat;
	let xUnitSummary;
	let yUnitSummary;
	let y2UnitSummary;
	let xDistinct;

	// Individual Config Sections:
	let horizAxisConfig;
	let verticalAxisConfig;
	let horizAxisTitleConfig;
	let chartConfig;

	// Chart area sizing:
	let hasTitle;
	let hasSubtitle;
	let hasLegend;
	let hasTopAxisTitle;
	let hasBottomAxisTitle;
	let titleFontSize;
	let subtitleFontSize;
	let titleBoxPadding;
	let titleBoxHeight;
	let chartAreaPaddingTop;
	let chartAreaPaddingBottom;
	let bottomAxisTitleSize;
	let topAxisTitleSize;
	let legendHeight;
	let legendPaddingTop;
	let legendTop;
	let chartTop;
	let chartBottom;
	let chartContainerHeight;
	let topAxisTitleTop;

	let horizAxisTitle;

	// Adjustment to avoid small bars on horizontal bar chart (extend chart height to accomodate):
	let maxBars;
	let barCount;
	let heightMultiplier;

	// Set final chart height:
	let height;
	let width;

	let missingCols = [];

	let originalRun = true;

	// Error Handling:

	let inputCols = [];
	let optCols = [];
	let i;

	let error;

	// Date String Handling:
	let columnSummaryArray;
	let dateCols;

	$: {
		try {
			error = undefined;
			missingCols = [];
			unusedColumns = [];
			// Error Handling:
			inputCols = [];
			optCols = [];
			uColName = [];
			ySet = y ? true : false;
			xSet = x ? true : false;

			checkInputs(data); // check that dataset exists

			// ---------------------------------------------------------------------------------------
			// Get column information
			// ---------------------------------------------------------------------------------------
			// Get column summary:
			columnSummary = getColumnSummary(data);

			// Get column names:
			columnNames = Object.keys(columnSummary);

			// ---------------------------------------------------------------------------------------
			// Make assumptions to complete required props
			// ---------------------------------------------------------------------------------------
			// If no x column was supplied, assume first column in dataset is x
			if (!xSet) {
				x = columnNames[0];
			}

			// If no y column(s) supplied, assume all number columns other than x are the y columns:
			if (!ySet) {
				uColNames = columnNames.filter(function (col) {
					return ![x, series, size].includes(col);
				});

				for (let i = 0; i < uColNames.length; i++) {
					uColName = uColNames[i];
					uColType = columnSummary[uColName].type;
					if (uColType === 'number') {
						unusedColumns.push(uColName);
					}
				}

				y = unusedColumns.length > 1 ? unusedColumns : unusedColumns[0];
			}
			// Establish required columns based on chart type:
			if (bubble) {
				reqCols = {
					x: x,
					y: y,
					size: size
				};
			} else if (hist) {
				reqCols = {
					x: x
				};
			} else if (boxplot) {
				reqCols = {};
			} else {
				reqCols = {
					x: x,
					y: y
				};
			}

			// Check which columns were not supplied to the chart:
			for (let property in reqCols) {
				if (reqCols[property] == null) {
					missingCols.push(property);
				}
			}

			if (missingCols.length === 1) {
				throw Error(new Intl.ListFormat().format(missingCols) + ' is required');
			} else if (missingCols.length > 1) {
				throw Error(new Intl.ListFormat().format(missingCols) + ' are required');
			}

			// Fix for stacked100 overwriting y variable. Bandaid fix - not a long-term solution:
			if (stacked100 === true && y.includes('_pct') && originalRun === false) {
				if (typeof y === 'object') {
					for (let i = 0; i < y.length; i++) {
						y[i] = y[i].replace('_pct', '');
					}
					originalRun = false;
				} else {
					y = y.replace('_pct', '');
					originalRun = false;
				}
			}

			// Check the inputs supplied to the chart:
			if (x) {
				inputCols.push(x);
			}
			if (y) {
				if (typeof y === 'object') {
					for (i = 0; i < y.length; i++) {
						inputCols.push(y[i]);
					}
				} else {
					inputCols.push(y);
				}
			}
			if (y2) {
				if (typeof y2 === 'object') {
					for (i = 0; i < y2.length; i++) {
						inputCols.push(y2[i]);
					}
				} else {
					inputCols.push(y2);
				}
			}
			if (size) {
				inputCols.push(size);
			}
			if (series) {
				optCols.push(series);
			}
			if (tooltipTitle) {
				optCols.push(tooltipTitle);
			}

			checkInputs(data, inputCols, optCols);

			// ---------------------------------------------------------------------------------------
			// Aggregate Data if Required
			// ---------------------------------------------------------------------------------------

			if (stacked100 === true) {
				data = getStackPercentages(data, x, y);

				if (typeof y === 'object') {
					for (let i = 0; i < y.length; i++) {
						y[i] = y[i] + '_pct';
					}
					originalRun = false;
				} else {
					y = y + '_pct';
					originalRun = false;
				}

				// Re-run column summary for new columns (not ideal):
				columnSummary = getColumnSummary(data);
			}

			// ---------------------------------------------------------------------------------------
			// Define x axis type
			// ---------------------------------------------------------------------------------------
			xDataType = columnSummary[x].type;

			// Get xDataType into ECharts default types:
			switch (xDataType) {
				case 'number':
					xDataType = 'value';
					break;
				case 'string':
					xDataType = 'category';
					break;
				case 'date':
					xDataType = 'time';
					break;
				default:
					break;
			}

			xType = xType === 'category' ? 'category' : xDataType;

			// Throw error if attempting to plot value or time on horizontal x-axis:
			if (swapXY && xType !== 'category') {
				throw Error(
					'Horizontal charts do not support a value or time-based x-axis. You can either change your SQL query to output string values or set swapXY=false.'
				);
			}

			// Throw error if attempting to plot secondary y-axis on horizontal chart:
			if (swapXY && y2) {
				throw Error(
					'Horizontal charts do not support a secondary y-axis. You can either set swapXY=false or remove the y2 prop from your chart.'
				);
			}

			// Override xType if axes are swapped - only category enabled on horizontal axis
			if (swapXY) {
				xType = 'category';
			}

			// Check for x mismatch:
			xMismatch = xDataType === 'value' && xType === 'category';

			// ---------------------------------------------------------------------------------------
			// Sort data based on xType
			// ---------------------------------------------------------------------------------------
			data = sort
				? xDataType === 'category'
					? getSortedData(data, y, false)
					: getSortedData(data, x, true)
				: data;

			// Always sort time axes by x - this prevents the lines from being drawn out of order
			if (xDataType === 'time') {
				data = getSortedData(data, x, true);
			}

			// ---------------------------------------------------------------------------------------
			// Standardize date columns
			// ---------------------------------------------------------------------------------------

			columnSummaryArray = getColumnSummary(data, 'array');
			dateCols = columnSummaryArray.filter((d) => d.type === 'date');
			dateCols = dateCols.map((d) => d.id);

			if (dateCols.length > 0) {
				for (let i = 0; i < dateCols.length; i++) {
					data = standardizeDateColumn(data, dateCols[i]);
				}
			}

			// ---------------------------------------------------------------------------------------
			// Get format codes for axes
			// ---------------------------------------------------------------------------------------
			if (xFmt) {
				xFormat = getFormatObjectFromString(xFmt, columnSummary[x].format?.valueType);
			} else {
				xFormat = columnSummary[x].format;
			}

			if (!y) {
				yFormat = 'str';
			} else {
				if (yFmt) {
					if (typeof y === 'object') {
						yFormat = getFormatObjectFromString(yFmt, columnSummary[y[0]].format?.valueType);
					} else {
						yFormat = getFormatObjectFromString(yFmt, columnSummary[y].format?.valueType);
					}
				} else {
					if (typeof y === 'object') {
						yFormat = columnSummary[y[0]].format;
					} else {
						yFormat = columnSummary[y].format;
					}
				}
			}

			if (y2) {
				if (y2Fmt) {
					if (typeof y2 === 'object') {
						y2Format = getFormatObjectFromString(y2Fmt, columnSummary[y2[0]].format?.valueType);
					} else {
						y2Format = getFormatObjectFromString(y2Fmt, columnSummary[y2].format?.valueType);
					}
				} else {
					if (typeof y2 === 'object') {
						y2Format = columnSummary[y2[0]].format;
					} else {
						y2Format = columnSummary[y2].format;
					}
				}
			}

			if (size) {
				if (sizeFmt) {
					sizeFormat = getFormatObjectFromString(sizeFmt, columnSummary[size].format?.valueType);
				} else {
					sizeFormat = columnSummary[size].format;
				}
			}

			xUnitSummary = columnSummary[x].columnUnitSummary;

			if (y) {
				if (typeof y === 'object') {
					yUnitSummary = columnSummary[y[0]].columnUnitSummary;
				} else {
					yUnitSummary = columnSummary[y].columnUnitSummary;
				}
			}

			if (y2) {
				if (typeof y2 === 'object') {
					y2UnitSummary = columnSummary[y2[0]].columnUnitSummary;
				} else {
					y2UnitSummary = columnSummary[y2].columnUnitSummary;
				}
			}

			xAxisTitle =
				xAxisTitle === 'true' ? formatTitle(x, xFormat) : xAxisTitle === 'false' ? '' : xAxisTitle;
			yAxisTitle =
				yAxisTitle === 'true'
					? typeof y === 'object'
						? ''
						: formatTitle(y, yFormat)
					: yAxisTitle === 'false'
						? ''
						: yAxisTitle;
			y2AxisTitle =
				y2AxisTitle === 'true'
					? typeof y2 === 'object'
						? ''
						: formatTitle(y2, y2Format)
					: y2AxisTitle === 'false'
						? ''
						: y2AxisTitle;

			// ---------------------------------------------------------------------------------------
			// Get total series count
			// ---------------------------------------------------------------------------------------
			let yCount = typeof y === 'object' ? y.length : 1;
			let seriesCount = series ? getDistinctCount(data, series) : 1;
			let ySeriesCount = yCount * seriesCount;

			// y2Count may need to be adjusted to also factor in the series column. For now, we really
			// only need to know that it's multi-series, so > 1 is sufficient
			let y2Count = typeof y2 === 'object' ? y2.length : y2 ? 1 : 0;
			let totalSeriesCount = ySeriesCount + y2Count;

			// ---------------------------------------------------------------------------------------
			// Set legend flag
			// ---------------------------------------------------------------------------------------
			if (legend !== undefined) {
				legend = legend === 'true' || legend === true;
			}

			legend = legend ?? totalSeriesCount > 1;

			// ---------------------------------------------------------------------------------------
			// Handle errors for log axes (cannot be used with stacked charts)
			// ---------------------------------------------------------------------------------------

			if (stacked100 === true && yLog === true) {
				throw Error('Log axis cannot be used in a 100% stacked chart');
			} else if (stackType === 'stacked' && totalSeriesCount > 1 && yLog === true) {
				throw Error('Log axis cannot be used in a stacked chart');
			}

			let minYValue;
			if (typeof y === 'object') {
				minYValue = columnSummary[y[0]].columnUnitSummary.min;
				for (let i = 0; i < y.length; i++) {
					if (columnSummary[y[i]].columnUnitSummary.min < minYValue) {
						minYValue = columnSummary[y[i]].columnUnitSummary.min;
					}
				}
			} else if (y) {
				minYValue = columnSummary[y].columnUnitSummary.min;
			}

			if (yLog === true && minYValue <= 0 && minYValue !== null) {
				throw Error('Log axis cannot display values less than or equal to zero');
			}

			// ---------------------------------------------------------------------------------------
			// Add props to store to let child components access them
			// ---------------------------------------------------------------------------------------
			props.update((d) => {
				return {
					...d,
					data,
					x,
					y,
					y2,
					series,
					swapXY,
					sort,
					xType,
					xFormat,
					yFormat,
					y2Format,
					sizeFormat,
					xMismatch,
					size,
					yMin,
					y2Min,
					columnSummary,
					xAxisTitle,
					yAxisTitle,
					y2AxisTitle,
					tooltipTitle,
					chartAreaHeight,
					chartType,
					yCount,
					y2Count
				};
			});

			// ---------------------------------------------------------------------------------------
			// Axis Configuration
			// ---------------------------------------------------------------------------------------
			xDistinct = getDistinctValues(data, x);
			let secondaryAxis;

			if (swapXY) {
				horizAxisConfig = {
					type: yType,
					logBase: yLogBase,
					position: 'top',
					axisLabel: {
						show: yAxisLabels,
						hideOverlap: true,
						showMaxLabel: true,
						formatter: function (value) {
							return formatAxisValue(value, yFormat, yUnitSummary);
						},
						margin: 4
					},
					min: yMin,
					max: yMax,
					scale: yScale,
					splitLine: {
						show: yGridlines
					},
					axisLine: {
						show: yBaseline,
						onZero: false
					},
					axisTick: {
						show: yTickMarks
					},
					boundaryGap: false,
					z: 2
				};
			} else {
				horizAxisConfig = {
					type: xType,
					min: xMin,
					max: xMax,
					splitLine: {
						show: xGridlines
					},
					axisLine: {
						show: xBaseline
					},
					axisTick: {
						show: xTickMarks
					},
					axisLabel: {
						show: xAxisLabels,
						hideOverlap: true,
						showMaxLabel: xType === 'category' || xType === 'value', // max label for ECharts' time axis is a stub - default for that is false
						formatter:
							xType === 'time' || xType === 'category'
								? false
								: function (value) {
										return formatAxisValue(value, xFormat, xUnitSummary);
									},
						margin: 6
					},
					scale: true,
					z: 2
				};
			}

			if (swapXY) {
				verticalAxisConfig = {
					type: xType,
					inverse: 'true',
					splitLine: {
						show: xGridlines
					},
					axisLine: {
						show: xBaseline
					},
					axisTick: {
						show: xTickMarks
					},
					axisLabel: {
						show: xAxisLabels,
						hideOverlap: true
						// formatter:
						//     function(value){
						//         return formatAxisValue(value, xFormat, xUnitSummary)
						//     },
					},
					scale: true,
					min: xMin,
					max: xMax,
					z: 2
				};
			} else {
				verticalAxisConfig = {
					type: yType,
					logBase: yLogBase,
					splitLine: {
						show: yGridlines
					},
					axisLine: {
						show: yBaseline,
						onZero: false
					},
					axisTick: {
						show: yTickMarks
					},
					axisLabel: {
						show: yAxisLabels,
						hideOverlap: true,
						margin: 4,
						formatter: function (value) {
							return formatAxisValue(value, yFormat, yUnitSummary);
						},
						color: y2
							? $yAxisColorStore === 'true'
								? $colorPaletteStore[0]
								: $yAxisColorStore !== 'false'
									? $yAxisColorStore
									: undefined
							: undefined
					},
					name: yAxisTitle,
					nameLocation: 'end',
					nameTextStyle: {
						align: 'left',
						verticalAlign: 'top',
						padding: [0, 5, 0, 0],
						color: y2
							? $yAxisColorStore === 'true'
								? $colorPaletteStore[0]
								: $yAxisColorStore !== 'false'
									? $yAxisColorStore
									: undefined
							: undefined
					},
					nameGap: 6,
					min: yMin,
					max: yMax,
					scale: yScale,
					boundaryGap: ['0%', '1%'],
					z: 2
				};

				secondaryAxis = {
					type: 'value',
					show: false,
					alignTicks: true,
					splitLine: {
						show: y2Gridlines
					},
					axisLine: {
						show: y2Baseline,
						onZero: false
					},
					axisTick: {
						show: y2TickMarks
					},
					axisLabel: {
						show: y2AxisLabels,
						hideOverlap: true,
						margin: 4,
						formatter: function (value) {
							return formatAxisValue(value, y2Format, y2UnitSummary);
						},
						color:
							$y2AxisColorStore === 'true'
								? $colorPaletteStore[ySeriesCount]
								: $y2AxisColorStore !== 'false'
									? $y2AxisColorStore
									: undefined
					},
					name: y2AxisTitle,
					nameLocation: 'end',
					nameTextStyle: {
						align: 'right',
						verticalAlign: 'top',
						padding: [0, 0, 0, 5],
						color:
							$y2AxisColorStore === 'true'
								? $colorPaletteStore[ySeriesCount]
								: $y2AxisColorStore !== 'false'
									? $y2AxisColorStore
									: undefined
					},
					nameGap: 6,
					min: y2Min,
					max: y2Max,
					scale: y2Scale,
					boundaryGap: ['0%', '1%'],
					z: 2
				};

				verticalAxisConfig = [verticalAxisConfig, secondaryAxis];
			}

			// ---------------------------------------------------------------------------------------
			// Set up chart area
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
			} else {
				chartAreaHeight = 180;
			}

			hasTitle = title ? true : false;
			hasSubtitle = subtitle ? true : false;
			hasLegend = legend * (series !== null || (typeof y === 'object' && y.length > 1));
			hasTopAxisTitle = yAxisTitle !== '' && swapXY;
			hasBottomAxisTitle = xAxisTitle !== '' && !swapXY;

			titleFontSize = 15;
			subtitleFontSize = 13;
			titleBoxPadding = 6 * hasSubtitle;

			titleBoxHeight =
				hasTitle * titleFontSize +
				hasSubtitle * subtitleFontSize +
				titleBoxPadding * Math.max(hasTitle, hasSubtitle);

			chartAreaPaddingTop = 10;
			chartAreaPaddingBottom = 8;

			bottomAxisTitleSize = 14;
			topAxisTitleSize = 14 + 0; // font size + padding top

			legendHeight = 15;
			legendHeight = legendHeight * hasLegend;

			legendPaddingTop = 7;
			legendPaddingTop = legendPaddingTop * Math.max(hasTitle, hasSubtitle);

			legendTop = titleBoxHeight + legendPaddingTop;
			chartTop =
				legendTop + legendHeight + topAxisTitleSize * hasTopAxisTitle + chartAreaPaddingTop;
			chartBottom = hasBottomAxisTitle * bottomAxisTitleSize + chartAreaPaddingBottom;

			// Adjustment to avoid small bars on horizontal bar chart (extend chart height to accomodate)
			// Small bars are allowed on normal bar chart (e.g., time series bar chart)
			maxBars = 8;
			heightMultiplier = 1;
			if (swapXY) {
				barCount = xDistinct.length;
				heightMultiplier = Math.max(1, barCount / maxBars);
			}

			chartContainerHeight = chartAreaHeight * heightMultiplier + chartTop + chartBottom;

			topAxisTitleTop = legendTop + legendHeight + 7;

			// Set final chart height:
			height = chartContainerHeight + 'px';
			width = '100%';

			// ---------------------------------------------------------------------------------------
			// Set up horizontal axis title (custom graphic)
			// ---------------------------------------------------------------------------------------
			horizAxisTitle = swapXY ? yAxisTitle : xAxisTitle;
			if (horizAxisTitle !== '') {
				horizAxisTitle = horizAxisTitle + ' →'; // u2192 is js escaped version of &rarr;
			}

			horizAxisTitleConfig = {
				id: 'horiz-axis-title',
				type: 'text',
				style: {
					text: horizAxisTitle,
					textAlign: 'right',
					fill: $theme.colors['base-content-muted']
				},
				cursor: 'auto',
				// Positioning (if swapXY, top right; otherwise bottom right)
				right: swapXY ? '2%' : '3%',
				top: swapXY ? topAxisTitleTop : null,
				bottom: swapXY ? null : '2%'
			};

			// ---------------------------------------------------------------------------------------
			// Build chart config and update config store so child components can access it
			// ---------------------------------------------------------------------------------------

			chartConfig = {
				title: {
					text: title,
					subtext: subtitle,
					subtextStyle: {
						width: width
					}
				},
				tooltip: {
					trigger: 'axis',
					// formatter function is overridden in ScatterPlot, BubbleChart, and Histogram
					formatter: function (params) {
						let output;
						let xVal;
						let yVal;
						let yCol;
						if (totalSeriesCount > 1) {
							// If multi-series, add series name as title of tooltip
							xVal = params[0].value[swapXY ? 1 : 0];
							output = `<span id="tooltip" style='font-weight: 600;'>${formatValue(
								xVal,
								xFormat
							)}</span>`;
							for (let i = params.length - 1; i >= 0; i--) {
								if (params[i].seriesName !== 'stackTotal') {
									yVal = params[i].value[swapXY ? 0 : 1];
									output =
										output +
										`<br> <span style='font-size: 11px;'>${params[i].marker} ${
											params[i].seriesName
										}<span/><span style='float:right; margin-left: 10px; font-size: 12px;'>${formatValue(
											yVal,
											// Not sure if this will work. Need to check with multi series on both axes
											// Check if echarts does the order in the same way - y first, then y2
											getYAxisIndex(params[i].componentIndex, yCount, y2Count) === 0
												? yFormat
												: y2Format
										)}</span>`;
								}
							}
						} else if (xType === 'value') {
							// If single-series and a numerical x-axis, include x column as a normal column rather than title (so as not to show a number as the title)
							xVal = params[0].value[swapXY ? 1 : 0];
							yVal = params[0].value[swapXY ? 0 : 1];
							yCol = params[0].seriesName;
							output = `<span id="tooltip" style='font-weight: 600;'>${formatTitle(
								x,
								xFormat
							)}: </span><span style='float:right; margin-left: 10px;'>${formatValue(
								xVal,
								xFormat
							)}</span><br/><span style='font-weight: 600;'>${formatTitle(
								yCol,
								yFormat
							)}: </span><span style='float:right; margin-left: 10px;'>${formatValue(
								yVal,
								yFormat
							)}</span>`;
						} else {
							// If single series and categorical or date x-axis, use x value as title of tooltip
							xVal = params[0].value[swapXY ? 1 : 0];
							yVal = params[0].value[swapXY ? 0 : 1];
							yCol = params[0].seriesName;
							output = `<span id="tooltip" style='font-weight: 600;'>${formatValue(
								xVal,
								xFormat
							)}</span><br/><span>${formatTitle(
								yCol,
								yFormat
							)}: </span><span style='float:right; margin-left: 10px;'>${formatValue(
								yVal,
								yFormat
							)}</span>`;
						}
						return output;
					},
					confine: true,
					axisPointer: {
						// Use axis to trigger tooltip
						type: 'shadow' // 'shadow' as default; can also be 'line' or 'shadow'
					},
					extraCssText:
						'box-shadow: 0 3px 6px rgba(0,0,0,.15); box-shadow: 0 2px 4px rgba(0,0,0,.12); z-index: 1; font-feature-settings: "cv02", "tnum";',
					order: 'valueDesc'
				},
				legend: {
					show: legend,
					type: 'scroll',
					top: legendTop,
					padding: [0, 0, 0, 0],
					data: []
				},
				grid: {
					left: '0.5%',
					right: swapXY ? '4%' : '3%',
					bottom: chartBottom,
					top: chartTop,
					containLabel: true
				},
				xAxis: horizAxisConfig,
				yAxis: verticalAxisConfig,
				series: [],
				animation: true,
				graphic: horizAxisTitleConfig,
				color: $colorPaletteStore
			};

			config.update(() => {
				return chartConfig;
			});
		} catch (e) {
			error = e.message;
			const setTextRed = '\x1b[31m%s\x1b[0m';
			console.error(setTextRed, `Error in ${chartType}: ${e.message}`);
			// if the build is in production fail instead of sending the error to the chart
			if (strictBuild) {
				throw error;
			}
			props.update((d) => {
				return { ...d, error };
			});
		}
	}
	$: data;
</script>

{#if !error}
	<slot />
	<ECharts
		config={$config}
		{height}
		{width}
		{data}
		{queryID}
		evidenceChartTitle={title}
		{showAllXAxisLabels}
		{swapXY}
		{echartsOptions}
		{seriesOptions}
		{printEchartsConfig}
		{renderer}
		{downloadableData}
		{downloadableImage}
		{connectGroup}
		seriesColors={$seriesColorsStore}
	/>
{:else}
	<ErrorChart {error} {chartType} />
{/if}
