<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { ECharts } from '@evidence-dev/core-components';
	import { strictBuild } from '@evidence-dev/component-utilities/chartContext';

	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import getDistinctValues from '@evidence-dev/component-utilities/getDistinctValues';
	import { ErrorChart } from '@evidence-dev/core-components';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import { getThemeStores } from '../../../themes/themes.js';
	import { toBoolean } from '$lib/utils.js';

	const { resolveColor, resolveColorPalette } = getThemeStores();

	export let echartsOptions = undefined;
	export let printEchartsConfig = false;
	$: printEchartsConfig = toBoolean(printEchartsConfig);

	export let colorPalette = 'default';
	$: colorPaletteStore = resolveColorPalette(colorPalette);

	export let data = undefined;
	export let x = undefined;
	export let y = undefined;
	export let series = undefined;

	export let title = undefined;
	export let subtitle = undefined;
	export let legend = true;
	$: legend = toBoolean(legend);

	export let yFmt = undefined;
	let yFormat;

	export let fillColor = undefined;
	$: fillColorStore = resolveColor(fillColor);

	export let fillOpacity = 0.3;

	export let lineColor = undefined;
	$: lineColorStore = resolveColor(lineColor);

	export let lineWidth = 2;

	export let markers = false;
	$: markers = toBoolean(markers);
	export let markerShape = 'circle';
	export let markerSize = 8;

	export let labels = false;
	$: labels = toBoolean(labels);
	export let labelSize = 11;
	export let labelPosition = 'top';

	export let labelColor = undefined;
	$: labelColorStore = resolveColor(labelColor);

	export let labelFmt = undefined;
	let labelFormat;

	export let showAllLabels = false;
	$: showAllLabels = toBoolean(showAllLabels);

	export let seriesOrder = undefined;

	export let shape = 'polygon';
	export let max = undefined;

	// Chart area sizing
	export let chartAreaHeight = '300';
	let hasTitle;
	let hasSubtitle;
	let hasLegend;
	let titleFontSize;
	let subtitleFontSize;
	let titleBoxPadding;
	let titleBoxHeight;
	let chartAreaPaddingTop;
	let chartAreaPaddingBottom;
	let legendHeight;
	let legendPaddingTop;
	let legendTop;
	let chartTop;
	let chartBottom;
	let chartContainerHeight;

	let height = '400px';
	let width = '100%';

	let columnSummary;
	let error;
	let config;

	$: try {
		error = undefined;

		checkInputs(data);

		columnSummary = getColumnSummary(data);
		const columnNames = Object.keys(columnSummary);

		// Default x to first column if not provided
		if (!x) {
			x = columnNames[0];
		}

		// Default y to first numeric column if not provided
		if (!y) {
			const numericCols = columnNames.filter(
				(col) => col !== x && col !== series && columnSummary[col].type === 'number'
			);
			y = numericCols.length > 1 ? numericCols : numericCols[0];
		}

		checkInputs(data, [x, y], [series]);

		// Get format objects
		yFormat = yFmt
			? getFormatObjectFromString(yFmt)
			: columnSummary[typeof y === 'object' ? y[0] : y]?.format;
		if (labelFmt) {
			labelFormat = getFormatObjectFromString(labelFmt);
		}

		// Build indicators and series data
		const xValues = getDistinctValues(data, x);

		// Calculate max values for each indicator
		let maxValues = {};
		if (typeof y === 'object') {
			for (const yCol of y) {
				for (const row of data) {
					const xVal = row[x];
					const yVal = row[yCol];
					if (yVal !== null && yVal !== undefined) {
						if (!maxValues[xVal] || yVal > maxValues[xVal]) {
							maxValues[xVal] = yVal;
						}
					}
				}
			}
		} else {
			for (const row of data) {
				const xVal = row[x];
				const yVal = row[y];
				if (yVal !== null && yVal !== undefined) {
					if (!maxValues[xVal] || yVal > maxValues[xVal]) {
						maxValues[xVal] = yVal;
					}
				}
			}
		}

		const indicators = xValues.map((xVal) => ({
			name: xVal,
			max: max !== undefined ? max : maxValues[xVal] * 1.1
		}));

		// Build series config
		let seriesData = [];

		if (series) {
			const seriesDistinct = getDistinctValues(data, series);

			for (const seriesVal of seriesDistinct) {
				const filteredData = data.filter((d) => d[series] === seriesVal);

				let values = [];
				if (typeof y === 'object') {
					for (const xVal of xValues) {
						const row = filteredData.find((d) => d[x] === xVal);
						let sum = 0;
						for (const yCol of y) {
							sum += row ? (row[yCol] ?? 0) : 0;
						}
						values.push(sum);
					}
				} else {
					for (const xVal of xValues) {
						const row = filteredData.find((d) => d[x] === xVal);
						values.push(row ? (row[y] ?? 0) : 0);
					}
				}

				seriesData.push({
					name: seriesVal ?? 'null',
					value: values
				});
			}
		} else if (typeof y === 'object') {
			for (const yCol of y) {
				let values = [];
				for (const xVal of xValues) {
					const row = data.find((d) => d[x] === xVal);
					values.push(row ? (row[yCol] ?? 0) : 0);
				}
				seriesData.push({
					name: columnSummary[yCol]?.title ?? yCol,
					value: values
				});
			}
		} else {
			let values = [];
			for (const xVal of xValues) {
				const row = data.find((d) => d[x] === xVal);
				values.push(row ? (row[y] ?? 0) : 0);
			}
			seriesData.push({
				name: columnSummary[y]?.title ?? y,
				value: values
			});
		}

		if (seriesOrder) {
			seriesData.sort((a, b) => seriesOrder.indexOf(a.name) - seriesOrder.indexOf(b.name));
		}

		// Chart area sizing
		if (chartAreaHeight) {
			chartAreaHeight = Number(chartAreaHeight);
			if (isNaN(chartAreaHeight)) {
				throw Error('chartAreaHeight must be a number');
			} else if (chartAreaHeight <= 0) {
				throw Error('chartAreaHeight must be a positive number');
			}
		} else {
			chartAreaHeight = 300;
		}

		hasTitle = title ? true : false;
		hasSubtitle = subtitle ? true : false;
		hasLegend = legend && seriesData.length > 1;

		titleFontSize = 15;
		subtitleFontSize = 13;
		titleBoxPadding = 6 * hasSubtitle;
		titleBoxHeight =
			hasTitle * titleFontSize +
			hasSubtitle * subtitleFontSize +
			titleBoxPadding * Math.max(hasTitle, hasSubtitle);

		chartAreaPaddingTop = 10;
		chartAreaPaddingBottom = 10;

		legendHeight = 15;
		legendHeight = legendHeight * hasLegend;

		legendPaddingTop = 7;
		legendPaddingTop = legendPaddingTop * Math.max(hasTitle, hasSubtitle);

		legendTop = titleBoxHeight + legendPaddingTop;
		chartTop = legendTop + legendHeight + chartAreaPaddingTop;
		chartBottom = chartAreaPaddingBottom;

		chartContainerHeight = chartAreaHeight + chartTop + chartBottom;

		height = chartContainerHeight + 'px';
		width = '100%';

		// Build ECharts series
		const radarSeries = seriesData.map((s, index) => ({
			type: 'radar',
			name: s.name,
			data: [{ name: s.name, value: s.value }],
			areaStyle: {
				color: $fillColorStore ?? $colorPaletteStore?.[index % $colorPaletteStore?.length],
				opacity: fillOpacity
			},
			lineStyle: {
				width: parseInt(lineWidth),
				color: $lineColorStore ?? $colorPaletteStore?.[index % $colorPaletteStore?.length]
			},
			itemStyle: {
				color: $lineColorStore ?? $colorPaletteStore?.[index % $colorPaletteStore?.length]
			},
			label: {
				show: labels,
				formatter: function (params) {
					const val = params.value;
					if (Array.isArray(val)) {
						return val.map((v) => formatValue(v, labelFormat ?? yFormat)).join(', ');
					}
					return formatValue(val, labelFormat ?? yFormat);
				},
				fontSize: labelSize,
				color: $labelColorStore,
				position: labelPosition,
				padding: 3
			},
			labelLayout: {
				hideOverlap: showAllLabels ? false : true
			},
			emphasis: {
				focus: 'series',
				lineStyle: {
					width: 3
				}
			},
			showSymbol: labels || markers,
			symbol: markerShape,
			symbolSize: labels && !markers ? 0 : markerSize
		}));

		config = {
			title: {
				text: title,
				subtext: subtitle,
				subtextStyle: {
					width: width
				}
			},
			tooltip: {
				trigger: 'item',
				formatter: function (params) {
					if (!params.value) return '';
					const values = params.value;
					let output = `<span style='font-weight: 600;'>${params.name}</span>`;
					for (let i = 0; i < indicators.length; i++) {
						output += `<br/>${indicators[i].name}: ${formatValue(values[i], yFormat)}`;
					}
					return output;
				},
				extraCssText:
					'box-shadow: 0 3px 6px rgba(0,0,0,.15); box-shadow: 0 2px 4px rgba(0,0,0,.12); z-index: 1;'
			},
			legend: {
				show: legend && seriesData.length > 1,
				type: 'scroll',
				top: legendTop,
				padding: [0, 0, 0, 0],
				data: seriesData.map((s) => s.name)
			},
			radar: {
				indicator: indicators,
				shape: shape,
				center: ['50%', '55%'],
				radius: '65%'
			},
			series: radarSeries,
			color: $colorPaletteStore
		};
	} catch (e) {
		error = e.message;
		console.error('Error in RadarChart: ' + e.message);
		if (strictBuild) {
			throw error;
		}
	}
</script>

{#if error}
	<ErrorChart chartType="Radar Chart" {error} />
{:else}
	<ECharts {data} {config} {width} {height} {echartsOptions} {printEchartsConfig} />
{/if}
